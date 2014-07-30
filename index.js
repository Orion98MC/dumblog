/**

  Blog model

  @param articlesPath
    full path of the articles

  @param options
    * meta, default: {}                           // The default meta
    * multiple: ['tags']                          // Which meta keys hold multiple values
    * fileRegExp: default: /\.txt$/               // Articles matching file names regexp
    * onArticle(new article): default noop        // Callback when an Article object is created
    * sort(Article a, Article b): default noop    // sort articles function

  @method articles()
    returns all the articles found and cache them for next calls
    Rq: articles are those that can be found at the articlesPath and match the fileRegExp. 
      If you don't want an article to be added to the articles cache list you may set it's meta.status to something else than "published"
      which is set automatically during import. This can easily be done in a onArticle callback.

  @method reload()
    reload articles

  Usage:
  ======

    var blog = new Blog('/path/to/articles', { 
      fileRegExp: /\.md$/, 
      onArticle: function (article) { article.HTMLContent = marked(article.content); },
      sort: function (a, b) { return a.modified_on < b.modified_on; }
    });

    var articles = blog.articles();
*/

function Blog(articlesPath, options) {
  console.log('- Starting blog at', articlesPath);
  if (!fs.existsSync(articlesPath)) {
    fs.mkdirSync(articlesPath);
  }
  
  this.options = options || {};
  this.options.meta = this.options.meta || this.Defaults.meta;
  this.options.multiple = this.options.multiple || this.Defaults.multiple;
  this.options.fileRegExp = this.options.fileRegExp || this.Defaults.fileRegExp;
  
  this.articlesPath = articlesPath;
  this._articles = this.articles();
}

Blog.prototype.Defaults = {
  meta : {
    from: "Unknown author",
    subject: "Unknown subject",
    status: "published",
    tags: []
  },
  multiple: ['tags'],
  sort: null,
  fileRegExp: /\.txt/,
  onArticle: null 
}

Blog.prototype.reload = function () {
  this._articles = null;
  this._articles = this.articles();
}

Blog.prototype.articles = function () {
  if (this._articles) return this._articles;
  
  var articles = [];
  var self = this;
  fs.readdirSync(this.articlesPath).forEach(function (file) {
    if (file.match(self.options.fileRegExp)) {
      var article = new Article(self.articlesPath + '/' + file, self.options);
      article.meta.status = "published";
      if (self.options.onArticle) self.options.onArticle(article);
      if (article.meta.status == 'published') articles.push(article);
    }
  });
  if (this.options.sort) articles = articles.sort(this.options.sort);
  return articles;
};


/**

  Article model

  @param filePath
    full path to the article file
  @param options
    * multiple: ['tags']    // Specify the meta keys that hold multiple values
    $ meta: {}

  @attr content
    returns the content part (String)
  @attr meta
    returns the meta part (Object)

  Usage:
  ======

  var article = new Article('/path/to/article');
  console.log(article.content, article.meta);


  Article format:
  ---------------
  
  We parse meta data in email-like format from the top of the document until an empty line is found. 
  After this new line it is assumed that we have the text content. Thus, if you don't need any meta you should
  take care of having a first empty line.

  <example.md>:
  from: orion
  subject: hello world!
  tags: foo, bar, baz

  # Hello
  world!
  ...  

*/

function Article(filePath, options) {
  this.options = options;
  
  this.meta = {};
  for (var key in this.options.meta) {
    if (this.options.multiple.indexOf(key) >= 0) this.meta[key] = this.options.meta[key].slice(0); // Copy array
    else this.meta[key] = this.options.meta[key];
  }
  
  var stat = fs.statSync(filePath)
  this.meta.modified_on = stat.mtime;
  this.meta.accessed_on = stat.atime;
  
  this.tidy(fs.readFileSync(filePath).toString());  
}

Article.prototype.tidy = function (raw) {
  var content = [];
  var meta = this.meta;
  var multiple = this.options.multiple || [];
  var hadEmptyLine = false;
  raw.split("\n").forEach(function (line) {
    if (line.match(/^$/)) hadEmptyLine = true;
    if (hadEmptyLine) content.push(line);
    else {
      var metaMatch = line.match(/^\s*([A-Za-z_\-0-9]+)\s*:\s*(.*)$/);
      if (metaMatch) { // Ex: foo: anything, bar, baz
        var key = metaMatch[1].toLowerCase(), string = metaMatch[2];
        var values = string.split(/\s*,\s*/).map(function (s){ return s.trim(); });
        meta[key] = multiple.indexOf(key) >= 0 ? values : values.join(', ');
      }
    } 
  });
  
  this.content = content.join("\n");
  this.meta = meta;
}

module.exports.Blog = Blog;
module.exports.Article = Article;