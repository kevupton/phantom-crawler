import { Observable } from 'rxjs';
import { from } from 'rxjs/internal/observable/from';
import { mapTo, shareReplay } from 'rxjs/operators';

export enum SetupStage {
  Inactive,
  Constructed,
  Destructed
}

export abstract class ManagerItem {

  private setupStage = SetupStage.Inactive;

  setup () : Observable<this> {
    if (this.setupStage !== SetupStage.Inactive) {
      throw new Error('Object is not in a correct state in order setup');
    }

    this.setupStage = SetupStage.Constructed;
    return from(this.handleConstruction() || null)
      .pipe(
        mapTo(this),
        shareReplay(1),
      );
  }

  protected abstract handleConstruction () : Observable<this> | void;

  destroy () : Observable<void> {
    if (this.setupStage !== SetupStage.Constructed) {
      throw new Error('Object has not be constructed. Therefore it cannot be destructed.');
    }

    this.setupStage = SetupStage.Destructed;
    return from(this.handleDestruct() || null)
      .pipe(
        mapTo(undefined),
        shareReplay(1),
      );
  }

  protected abstract handleDestruct () : Observable<any> | void;
}
