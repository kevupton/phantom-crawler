import { AsyncSubject, BehaviorSubject, Observable, Subject } from 'rxjs';
import { finalize, share } from 'rxjs/operators';

interface EventSubscriptions {
  [key : string] : Observable<any>;
}

export type EventCallback = (...args : any[]) => any;

export class RxjsBasicEventManager {
  private readonly eventsSubject = new BehaviorSubject<EventSubscriptions>({});
  private readonly resetSubject = new Subject<void>();

  constructor (
    private readonly onEventHandler : (event : string, fn : EventCallback) => Observable<any>,
    private readonly offEventHandler : (event : string, fn : EventCallback) => Observable<any>,
  ) {}

  reset () {
    this.resetSubject.next();
    this.eventsSubject.next({});
  }

  getEvent$ (event : string) {
    const events = this.eventsSubject.value;
    if (events[event]) {
      return events[event];
    }

    const event$ = this.generateEventListener(event);
    this.eventsSubject.next({
      ...events,
      [event]: event$,
    });

    return event$;
  }

  private generateEventListener (event : string) : Observable<any[]> {
    let fnToRegister : EventCallback;
    const removeEvent = () => this.offEventHandler(event, fnToRegister);

    return new Observable<any[]>(subscriber => {
      fnToRegister = (...args : any[]) => subscriber.next(args);
      this.onEventHandler(event, fnToRegister);

      // complete the observable when reset has fired.
      subscriber.add(this.resetSubject.subscribe(() => subscriber.complete()));
    }).pipe(
      finalize(removeEvent),
      share(),
    );
  }
}
