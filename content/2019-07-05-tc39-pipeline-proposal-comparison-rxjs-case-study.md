+++
title= "TC39 Pipeline proposal comparison - RxJS case study"
date = "2019-07-05"
description= "Exploration of the proposed JS pipeline operator in the context RxJS pipelines"
[taxonomies]
tags= ["javascript", "pipeline", "rxjs"]
+++

As you may or may not be aware there is an exciting new operator possible coming to javascript - the `|>` pipeline operator. I don't want to re-tell what it is and how it is useful, Ben Lesh has already done an excellent job of this so read [his article](https://dev.to/benlesh/a-simple-explanation-of-functional-pipe-in-javascript-2hbj) first. Instead, I'm going to investigate the two competing proposals, using RxJS as a case study as this is a use-case where I'm particularly excited about the new operator.

_Forewarning, this article is opinionated! If you have a differing opinion I'd love to have my mind changed as I have swung opinions on this topic a couple of times._

Before we dive into RxJS, let's just recap first the two types and their features/shortcomings.

## Minimal/Point-free Style
<sup>[try it!](https://babeljs.io/en/repl#?babili=false&browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=MYewdgzgLgBAtgQwA4wLwwGZjQPhggJwN3yIDpEkAKLASgG4AoUSWDASwBsoBTY9LCUL88wsh258aYBs3DQYBHgBMArsB5oY0gDQx2tIUSMEyStRt37ZLBezDAlcHmFjoAbiU8BqGAEYmW1gEZWUtBBIAIyEYX0imOVZFHghVbi0AbT8dACYdAGYAXUYYAB88SioI1FEYACoYHNoS8swuXgIqmLwAVmayvHN1HioqVLg9BEMa_G9xvQAGftb7Rx5nVxbRUKp85sSIEE4eMk4QAHMqJVTuBhgAenv_BaA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2015%2Creact%2Cstage-1%2Cstage-2&prettier=false&targets=&version=7.5.0&externalPlugins=)</sup>

```js
const map = fn => arr => arr.map(fn);
const filter = fn => arr => arr.filter(fn);
const reduce = (fn, i) => arr => arr.reduce(fn, i);
const increment = v => v + 1;
const add = a => b => a + b;

const result = [1,2,3]
 |> map(a => a * 2)
 |> filter(a => a > 5)
 |> reduce((sum, a) => a+sum, 0)
 |> increment
 |> add(3)

console.log(result); // 10
```

In this example you can see that we had to do a bit of preparatory work with our functions to make them [point-free style](https://en.wikipedia.org/wiki/Tacit_programming), that is they return a function that takes one argument. Once this prep is done, the pipeline becomes a simple composition of operators. It's worth noting at this point that this isn't really a great example as you should probably in future still be using the `Array.prototype.*` methods anyway. I just picked an example that should feel familiar.


## Topic Style (a.k.a Smart Mix)
<sup>[try it!](https://babeljs.io/en/repl#?babili=false&browsers=&build=&builtIns=false&spec=false&loose=false&code_lz=MYewdgzgLgBAlmYAnApgWxWWBeGBDGbAPnxgGoYBGAbgChRJY8ATZwmACjwBoYAjAJSESBCnzr1w0GKggBXADY4YAbUrcATNwDMAXVowAPiQDEAOjR4ADl2GkAVDA0wBB4zHMAzOEpRJbxKQkAKyuRqZmqMxywCgcHPJovHhCgXhkibwADGHuCMjomFBuIqwcJrzarpKQIAooZgogAOYcsopQAtQwAPQ9VFlAA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=es2015%2Creact%2Cstage-1%2Cstage-2&prettier=false&targets=&version=7.5.0&externalPlugins=) - (pick "Smart" in the pipeline proposal on the left)</sup>

```js
const increment = a => a + 1;
const add = (a, b) => a + b;

const result = [1,2,3]
 |> #.map(a => a * 2 )
 |> #.filter(a => a > 5)
 |> #.reduce((sum, a) => a+sum, 0)
 |> increment
 |> add(#, 3)

console.log(result); // 10
```

Topic style takes a different approach by essentially considering the bit where you use the function as a "template" for its actual invocation. Because the argument is not known ahead of time, we use `#` as a placeholder for that value to be used once it is known.

This strategy does have the advantage that the functions used in the pipeline are simple in their declaration, at the cost that the pipeline itself is slightly more verbose.

Additionally in my personal opinion it feels like additional cognitive load that when I do something like `add(#, 3)` I need to understand that I'm not really invoking the add function at all when this line of code is reached, rather I am defining a template for its execution.


With this dummy example there isn't really a lot differentiating the two proposals, but I don't think it is really very realistic anyway, so let's get real!

Using RxJS we will define a pipeline which takes user input from a textbox, ignores it when character count is less than two, debounces their keystrokes, then queries an api for search results.


## RxJS pre-pipeline
```js
const searchResults$ = fromEvent(document.querySelector('input'), 'input').pipe(
  map(event => event.target.value),
  filter(searchText => searchText.length > 2),
  debounce(300),
  distinctUntilChanged(),
  switchMap(searchText => queryApi(searchText).pipe(retry(3))),
  share(),
)
```
This simply implements the description given above. RxJS uses the `.pipe()` method in lieu of something better - Javascript pipeline operator:

## RxJS Minimal/Point-free Style
```js

const searchResults$ = fromEvent(document.querySelector('input'), 'input')
  |> map(event => event.target.value)
  |> filter(searchText => searchText.length > 2)
  |> debounce(300)
  |> distinctUntilChanged()
  |> switchMap(searchText => queryApi(searchText) |> retry(3))
  |> share()
  
```
This is pretty much exactly the same syntax as before, but much tidier and cleaner to read due to the new `|>` operator. How nice is that inline operator within the `switchMap`?

For comparison purposes, let's see how the above might look with the topic-style operator implementation:

## RxJS Topic Style
```js

const searchResults$ = fromEvent(document.querySelector('input'), 'input')
  |> map(#, event => event.target.value)
  |> filter(#, searchText => searchText.length > 2)
  |> debounce(#, 300)
  |> distinctUntilChanged
  |> switchMap(#, searchText => queryApi(searchText) |> retry(#, 3))
  |> share
  
```

Hmmm. I am not a fan. Maybe it is just a lack of familiarity talking, but the requirement that all operators need to be passing in the observable as a topic feels really unclean. Of course this would require rewriting all the RxJS operators to use this new syntax and take an observable as the first argument.


What do you think? Is there something really compelling about the topic style operator that I am missing? I know much of the discussion has been around how to handle the `await` keyword, but honestly I rarely use `async/await` now that RxJS is mostly what I use, but that is _just my personal experience_.

On a different note, [the TC39 proposal](https://github.com/tc39/proposal-pipeline-operator/issues) feels like it has stagnated a bit, as the Github issues are pretty much all comments from last year. Let's kick start the discussion again and see if we can nudge it one step closer to being used!
