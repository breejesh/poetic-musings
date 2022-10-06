import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-poem-content',
  templateUrl: './poem-content.component.html',
  styleUrls: ['./poem-content.component.scss']
})
export class PoemContentComponent implements OnInit {

  title = 'O Captain! My Captain!';
  author = 'Walt Whitman';
  jsonString = "<p><span class=\"long-line\">O Captain! my Captain! our fearful trip is done, </span><br /><span class=\"long-line\">The ship has weather\u2019d every rack, the prize we sought is won, </span><br /><span class=\"long-line\">The port is near, the bells I hear, the people all exulting,</span><br /><span class=\"long-line\">While follow eyes the steady keel, the vessel grim and daring;</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0But O heart! heart! heart!</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0O the bleeding drops of red, </span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0Where on the deck my Captain lies, </span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0Fallen cold and dead.</span></p>\n\n<p><span class=\"long-line\">O Captain! my Captain! rise up and hear the bells; </span><br /><span class=\"long-line\">Rise up- for you the flag is flung- for you the bugle trills, </span><br /><span class=\"long-line\">For you bouquets and ribbon\u2019d wreaths- for you the shores a-crowding,</span><br /><span class=\"long-line\">For you they call, the swaying mass, their eager faces turning;</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0Here Captain! dear father!</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0This arm beneath your head!</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0It is some dream that on the deck,</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0You\u2019ve fallen cold and dead.</span></p>\n\n<p><span class=\"long-line\">My Captain does not answer, his lips are pale and still,</span><br /><span class=\"long-line\">My father does not feel my arm, he has no pulse nor will,</span><br /><span class=\"long-line\">The ship is anchor\u2019d safe and sound, its voyage closed and done,</span><br /><span class=\"long-line\">From fearful trip the victor ship comes in with object won;</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0Exult O shores, and ring O bells!</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0But I with mournful tread,</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0Walk the deck my Captain lies,</span><br /><span class=\"long-line\">\u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0 \u00a0Fallen cold and dead.</span></p>";

  constructor() { }

  ngOnInit(): void {
  }

}
