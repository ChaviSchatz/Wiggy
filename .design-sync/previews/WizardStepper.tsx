import * as React from 'react';
import { WizardStepper } from 'wiggy-design-system';

export function IntakeWizard() {
  return (
    <div style={{ maxWidth: 520 }}>
      <WizardStepper
        steps={['לקוחה', 'סוג הזמנה', 'פרטי הזמנה', 'סיכום ואישור']}
        current={2}
        onStepClick={() => {}}
      />
    </div>
  );
}

export function StepOne() {
  return (
    <div style={{ maxWidth: 520 }}>
      <WizardStepper steps={['לקוחה', 'סוג הזמנה', 'פרטי הזמנה', 'סיכום ואישור']} current={0} />
    </div>
  );
}
