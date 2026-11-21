import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CommunityConfig, CommunityService } from '../../core/services/community.service';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';
@Component({selector:'app-contact',imports:[ReactiveFormsModule,RouterLink],templateUrl:'./contact.component.html',changeDetection:ChangeDetectionStrategy.OnPush})
export class ContactComponent implements OnInit {
  private readonly api = inject(CommunityService);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly config = signal<CommunityConfig | null>(null);
  readonly loading = signal(true); readonly pending = signal(false);
  readonly error = signal<string | null>(null); readonly reference = signal<string | null>(null);
  readonly form = this.fb.group({name:['',[Validators.required,Validators.minLength(2),Validators.maxLength(100)]],email:['',[Validators.required,Validators.email,Validators.maxLength(254)]],subject:['consulta',Validators.required],message:['',[Validators.required,Validators.minLength(10),Validators.maxLength(5000)]],privacyAccepted:[false,Validators.requiredTrue],website:['']});
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true);this.error.set(null);this.api.config().pipe(finalize(()=>this.loading.set(false))).subscribe({next:c=>this.config.set(c),error:()=>this.error.set('No pudimos cargar el canal de soporte. Reintentá en unos instantes.')}); }
  submit(): void {
    if (this.pending() || !this.config()?.contactEnabled) return;
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.pending.set(true);this.error.set(null);
    this.api.contact(this.form.getRawValue()).pipe(finalize(()=>this.pending.set(false))).subscribe({next:r=>{this.reference.set(r.id);this.form.reset({subject:'consulta'});},error:(e:HttpErrorResponse)=>this.error.set(extractApiErrorMessage(e,'No pudimos registrar tu consulta. Intentá nuevamente.'))});
  }
}
