/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  Optional,
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  combineLatestWith,
  distinctUntilChanged,
  map,
  filter,
  mergeMap,
  startWith,
  withLatestFrom,
} from 'rxjs/operators';
import {
  getRouteKind,
  getExperimentIdsFromRoute,
  getExperiment,
} from '../../selectors';
import {RouteKind} from '../../app_routing/types';

import {getEnvironment} from '../store';
import {State} from '../state';
import {TB_BRAND_NAME} from '../types';

/** @typehack */ import * as _typeHackRxjs from 'rxjs';

const DEFAULT_BRAND_NAME = 'TensorBoard';

/**
 * Renders page title.
 */
@Component({
  selector: 'page-title',
  template: `
    <page-title-component [title]="title$ | async"></page-title-component>
  `,
  styles: [
    `
      :host {
        display: none;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageTitleContainer {
  private readonly getExperimentId$ = this.store.select(getRouteKind).pipe(
    filter((routeKind) => routeKind === RouteKind.EXPERIMENT),
    withLatestFrom(this.store.select(getExperimentIdsFromRoute)),
    map(([, experimentIds]) =>
      experimentIds && experimentIds.length === 1 ? experimentIds[0] : null
    )
  );

  private readonly experimentName$ = this.getExperimentId$.pipe(
    filter(Boolean),
    mergeMap((experimentId) => {
      return this.store.select(getExperiment, {experimentId});
    }),
    map((experiment) => (experiment ? experiment.name : null))
  );

  readonly title$ = this.store.select(getEnvironment).pipe(
    combineLatestWith(this.experimentName$),
    map(([env, experimentName]) => {
      const tbBrandName = this.customBrandName || DEFAULT_BRAND_NAME;
      if (env.window_title) {
        // (it's an empty string when the `--window_title` flag is not set)
        return env.window_title;
      } else if (experimentName) {
        return `${experimentName} - ${tbBrandName}`;
      } else {
        return tbBrandName;
      }
    }),
    startWith(this.customBrandName || DEFAULT_BRAND_NAME),
    distinctUntilChanged()
  );

  constructor(
    private readonly store: Store<State>,
    @Optional() @Inject(TB_BRAND_NAME) private readonly customBrandName: string
  ) {}
}
