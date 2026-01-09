import {Component, input} from '@angular/core';
import {DatePipe} from '@angular/common';

@Component({
  selector: 'zh-article-container',
  imports: [
    DatePipe
  ],
  templateUrl: './article-container.html',
  styleUrl: './article-container.scss',
})
export class ArticleContainer {
  date = input.required<string>();
}
