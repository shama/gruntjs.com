'use strict';

var $ = require('jquery');
var base64 = require('base64');
var markdown = require("markdown");
require("jquery-hashchange");

function Docs(branch) {
  var that = this;

  // default options for github
  this.options = {
    user: 'cowboy',
    repo: 'grunt',
    sha: branch || 'master'
  };

  // hold our remote docs
  this.docs = {};

  // get the docs
  this.github('/repos/:user/:repo/git/trees/:sha?recursive=1', this.options, function(err, data) {
    if (data.meta.status !== 200) {
      $('.content').html(data.data.message);
      return;
    }
    data.data.tree.forEach(function(tree) {
      if (tree.path.indexOf('docs/') !== -1) {
        that.docs[tree.path] = tree;
      }
    });
    that.load();
  });
}

// load the docs into the html
Docs.prototype.load = function() {
  // load toc
  this.markdown('docs/toc.md', $('.toc'));

  // load getting started
  // TODO: Modify all links to use hash to load dynamically
  this.markdown('docs/getting_started.md', $('.content'));
};

// get data from github
Docs.prototype.github = function(url, options, callback) {
  var parts = url.match(/:[^\/|\?|\.]+/g);
  parts && parts.forEach(function(part) {
    url = url.replace(part, options[part.substr(1)]);
  });
  $.ajax({
    url: 'https://api.github.com' + url,
    type: 'GET',
    dataType: 'jsonp',
    success: function(data) {
      callback(null, data);
    }
  });
};

// load a single md file, convert and set on html element
Docs.prototype.markdown = function(filepath, into) {
  if (!this.docs[filepath]) {
    return;
  }
  this.options.sha = this.docs[filepath].sha;
  this.github('/repos/:user/:repo/git/blobs/:sha', this.options, function(err, data) {
    markdown(base64.decode(data.data.content), function(err, html) {
      into.html(html);
    });
  });
};

$(function() {

  // create our page from the index template
  $('body').html(require('raw!../src/index.html'));

  // start the Docs
  new Docs();

  // change the branch of the docs
  // TODO: This will be expanded much more than branch switching
  $(window).hashchange(function() {
    $(window).scrollTop(0);
    var hash = new String(location.hash).substr(2);
    $('.toc,.content').html('<p>Loading...</p>');
    new Docs(hash);
    $('.version').find('a').toggleClass('active');
  });

});