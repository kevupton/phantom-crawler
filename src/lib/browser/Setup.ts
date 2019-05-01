import { Observable } from 'rxjs';
import { mapTo } from 'rxjs/operators';

export enum SetupStage {
  Inactive,
  Constructed,
  Destructed
}

export abstract class Setup {

  private setupStage = SetupStage.Inactive;

  setup() : Observable<void> {
    if (this.setupStage !== SetupStage.Inactive) {
      throw new Error('Object is not in a correct state in order setup');
    }

    this.setupStage = SetupStage.Constructed;
    return this.handleSetup().pipe(mapTo(undefined));
  }

  protected abstract handleSetup() : Observable<any>;

  destruct() : Observable<void> {
   if (this.setupStage !== SetupStage.Constructed) {
     throw new Error('Object has not be constructed. Therefore it cannot be destructed.');
   }

   this.setupStage = SetupStage.Destructed;
   return this.handleDestruct().pipe(mapTo(undefined));
  }

  protected abstract handleDestruct () : Observable<any>;
}
