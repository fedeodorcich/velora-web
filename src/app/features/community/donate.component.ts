import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CommunityConfig, CommunityService } from '../../core/services/community.service';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';
@Component({selector:'app-donate',imports:[ReactiveFormsModule,RouterLink],templateUrl:'./donate.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class DonateComponent implements OnInit {
  private readonly api=inject(CommunityService);readonly auth=inject(AuthService);
  readonly adFree=signal(false);
  readonly returned=inject(ActivatedRoute).snapshot.queryParamMap.has('retorno');
  readonly config=signal<CommunityConfig|null>(null);readonly error=signal<string|null>(null);readonly pending=signal(false);readonly loading=signal(true);
  readonly amount=new FormControl(1000,{nonNullable:true});
  ngOnInit():void {this.load();if(this.auth.isAuthenticated())this.api.advertising().subscribe({next:s=>this.adFree.set(s.adFree),error:()=>{}});}
  load():void {this.loading.set(true);this.error.set(null);this.api.config().pipe(finalize(()=>this.loading.set(false))).subscribe({next:c=>this.config.set(c),error:()=>this.error.set('No pudimos consultar los aportes. Intentá nuevamente en unos instantes.')});}
  test():void {if(this.pending())return;this.pending.set(true);this.error.set(null);this.api.testDonation(this.amount.value).pipe(finalize(()=>this.pending.set(false))).subscribe({next:r=>window.location.assign(r.url),error:(e:HttpErrorResponse)=>this.error.set(extractApiErrorMessage(e,'No pudimos abrir el checkout de prueba.'))});}
}
