import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LEGAL_CONTACT, LEGAL_CONTACT_READY } from '../../../core/config/legal.config';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './terms.component.html',
})
export class TermsComponent {
  readonly legal = LEGAL_CONTACT;
  readonly contactReady = LEGAL_CONTACT_READY;
}
