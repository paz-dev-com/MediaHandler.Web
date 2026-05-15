import { AnimationTriggerMetadata } from '@angular/animations';
import { routeAnimations } from './route.animations';

describe('routeAnimations', () => {
  it('is an AnimationTriggerMetadata object', () => {
    expect(routeAnimations).toBeDefined();
    expect(typeof routeAnimations).toBe('object');
  });

  it('has the trigger name "routeAnimation"', () => {
    const trigger = routeAnimations as AnimationTriggerMetadata;
    expect(trigger.name).toBe('routeAnimation');
  });

  it('exports a trigger with at least one transition definition', () => {
    const trigger = routeAnimations as AnimationTriggerMetadata;
    // AnimationTriggerMetadata has a `definitions` array
    const definitions = (trigger as unknown as { definitions: unknown[] }).definitions;
    expect(Array.isArray(definitions)).toBe(true);
    expect(definitions.length).toBeGreaterThan(0);
  });

  it('trigger type is 7 (trigger)', () => {
    // AnimationMetadataType.Trigger === 7
    const trigger = routeAnimations as AnimationTriggerMetadata;
    expect(trigger.type).toBe(7);
  });
});
