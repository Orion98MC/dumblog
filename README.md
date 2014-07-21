# Dumblog

Why? Because.

## Requirement

none

## Install

```js
$ npm i dumblog --save
``` 

## Usage

```js
var Blog = require('dumblog').Blog;

var blog = new Blog(__dirname + '/blog/articles', {
  fileRegExp: /\.md$/
});

var articles = blog.articles();
````

This will find all articles matching '*.md' in blog/articles directory.

## Articles

You may write articles in any format you like but, dumblog expects to find email-like meta information at the beginning of each article files __AND__ an __EMPTY__ line before the content:

```
from: orion
subject: New article!
foo: bar

The article's content starts here after a __REQUIRED__ empty line...
```



## Meta 

You can put any meta attributes in your articles. 
If an attribute is expected to be an array, then separate each elements with commas like so:

```
tags: foo, bar, baz
```

And of course you need to tell dumblog that the 'tags' meta is an array. Why? Because Dumblog is so dumb!

```js
var blog = new Blog(__dirname + '/blog/articles', {
  multiple: ['tags']
});
````

By default, meta.tags is known (Huh.. at least one thing it knows :) to be an array.

You can also define default metas for articles:
```js
var blog = new Blog(__dirname + '/blog/articles', {
  meta: {
    from: 'me',
    subject: 'no idea'
  }
});
````
Each article's metas will override these default values.

### Accessors

An article has 2 main accessors:

* meta: the meta information read while parsing the file. It is an Object of key/values
* content: the raw content as read while parsing the file. It is a String.

```js
var article = articles[0];
console.log(article.meta.from, article.content);
````

On top of which article file modification and access time are automatically recorded in the meta object:
```js
var article = articles[0];
console.log(article.meta.modified_on, article.meta.accessed_on);
````
They are both Date objects



## Callbacks

To very easily accomodate any format like __markdown__, __textile__ etc ... Dumblog is totally agnostic (Heh!).

What you should do is provide your own transformation to the articles' raw content in a "onArticle" callback like so:

```js
var 
  marked = require('marked')
  
  blog = new Blog(__dirname + '/blog/articles', {
    onArticle: function (article) {
      article.HTMLContent = marked(article.content);
    }
  });
````

You can also provide a sort function so that articles will be sorted the right way when they are fetched:
```js
var blog = new Blog(__dirname + '/blog/articles', {
  sort: function (a, b) {
    return a.meta.modified_on > b.meta.modified_on
  }
});
````


## License

Copyright (c) 2014, Thierry Passeron
MIT License

