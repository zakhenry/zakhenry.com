import {Component, signal} from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Nav} from './nav/nav';

@Component({
  selector: 'zh-root',
  imports: [RouterOutlet, Nav],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  currentYear = new Date().getFullYear();
  protected readonly title = signal('zakhenry.com');
}
