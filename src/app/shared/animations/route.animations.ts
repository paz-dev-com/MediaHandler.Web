import {
  animate,
  animateChild,
  group,
  query,
  style,
  transition,
  trigger,
} from '@angular/animations';

// Cross-fade route transition — opacity 1→0 outgoing, 0→1 incoming, 150ms each.
// Triggered by route.data['animation'] string per route definition.
export const routeAnimations = trigger('routeAnimation', [
  transition('* <=> *', [
    style({ position: 'relative' }),
    query(
      ':enter, :leave',
      [
        style({
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
        }),
      ],
      { optional: true },
    ),
    query(':enter', [style({ opacity: 0 })], { optional: true }),
    query(':leave', [animateChild()], { optional: true }),
    group([
      query(':leave', [animate('150ms ease-out', style({ opacity: 0 }))], { optional: true }),
      query(':enter', [animate('150ms ease-in', style({ opacity: 1 }))], { optional: true }),
    ]),
    query(':enter', [animateChild()], { optional: true }),
  ]),
]);
