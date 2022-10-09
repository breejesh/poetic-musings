import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatNumberShortSuffix',
})
export class FormatNumberShortSuffixPipe implements PipeTransform {
  readonly ranges = [
    { divider: 1e3, suffix: 'K' },
    { divider: 1e6, suffix: 'M' },
    { divider: 1e9, suffix: 'B' },
  ];

  transform(input: number): string {
    for (let index = this.ranges.length - 1; index >= 0; index--) {
      if (input > this.ranges[index].divider) {
        let quotient = input / this.ranges[index].divider;

        if (quotient < 10) {
          quotient = Math.floor(quotient * 10) / 10;
        } else {
          quotient = Math.floor(quotient);
        }

        return quotient.toString() + this.ranges[index].suffix;
      }
    }

    return input.toString();
  }
}
