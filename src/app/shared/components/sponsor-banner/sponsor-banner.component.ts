import { AdsenseSlotComponent } from '../adsense-slot/adsense-slot.component';
import { Component, effect, inject, input, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { API_BASE_URL } from '../../../core/config/api.config';
interface AdStatus{adFree:boolean;adsense:{client:string;slot:string}|null;sponsor:{name:string;description:string;url:string}|null;}
@Component({selector:'app-sponsor-banner',standalone:true,imports:[AdsenseSlotComponent],templateUrl:'./sponsor-banner.component.html'})
export class SponsorBannerComponent{
 readonly compact=input(false);
 private readonly auth=inject(AuthService);
 private readonly http=inject(HttpClient);
 readonly adsense=signal<AdStatus['adsense']>(null);
 readonly adChoice=signal<'unknown'|'allow'|'deny'>('unknown');
 readonly sponsor=signal<AdStatus['sponsor']>(null);
 constructor(){effect(onCleanup=>{
 const token=this.auth.getToken();this.sponsor.set(null);this.adsense.set(null);this.adChoice.set('unknown');
 if(!token)return;
 const subscription=this.http.get<AdStatus>(API_BASE_URL+'/community/advertising').subscribe({next:status=>{
 if(!status.adFree&&status.adsense)this.adsense.set(status.adsense);
 if(!status.adFree&&status.sponsor){try{const url=new URL(status.sponsor.url);if(url.protocol==='https:'&&!url.username&&!url.password)this.sponsor.set(status.sponsor);}catch{}}
 },error:()=>this.sponsor.set(null)});
 onCleanup(()=>subscription.unsubscribe());
 });}
}
