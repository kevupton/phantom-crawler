import { AsyncSubject, Observable, Subscription } from 'rxjs';
import { from } from 'rxjs/internal/observable/from';
import { mapTo, shareReplay, tap } from 'rxjs/operators';

export enum SetupStage {
  Inactive,
  Constructed,
  Destructed
}

export abstract class ManagerItem {

  private setupStage                  = SetupStage.Inactive;
  private readonly destroyedSubject   = new AsyncSubject<void>();
  private readonly constructedSubject = new AsyncSubject<void>();
  private readonly subscriptions      = new Subscription();

  get destroyed$ () {
    return this.destroyedSubject.asObservable();
  }

  get constructed$ () {
    return this.constructedSubject.asObservable();
  }

  setup () : Observable<this> {
    if (this.setupStage !== SetupStage.Inactive) {
      throw new Error('Object is not in a correct state in order setup');
    }

    this.setupStage = SetupStage.Constructed;
    return from(this.handleConstruction() || null)
      .pipe(
        tap(() => {
          this.constructedSubject.next();
          this.constructedSubject.complete();
        }),
        mapTo(this),
        shareReplay(1),
      );
  }

  protected abstract handleConstruction () : Observable<any> | void;

  destroy () : Observable<void> {
    if (this.setupStage === SetupStage.Destructed) {
      throw new Error('Object has already been destructed');
    }
    if (this.setupStage !== SetupStage.Constructed) {
      throw new Error('Object has not be constructed. Therefore it cannot be destructed.');
    }

    this.setupStage = SetupStage.Destructed;
    this.subscriptions.unsubscribe();

    return from(this.handleDestruct() || null)
      .pipe(
        tap(() => {
          this.destroyedSubject.next();
          this.destroyedSubject.complete();
        }),
        mapTo(undefined),
        shareReplay(1),
      );
  }

  protected abstract handleDestruct () : Observable<any> | void;

  protected unsubscribeOnDestroy (subscription : Subscription) {
    this.subscriptions.add(subscription);
  }
}
