import {Component} from '@angular/core';
import {ArticleContainer} from '../../article-container/article-container';
import worker from './snippets/worker.ts.txt?raw'

@Component({
  selector: 'zh-observable-webworkers',
  imports: [
    ArticleContainer
  ],
  templateUrl: './observable-webworkers.html',
  styleUrl: './observable-webworkers.scss',
})
export default class ObservableWebworkers {

  worker = worker;

}
