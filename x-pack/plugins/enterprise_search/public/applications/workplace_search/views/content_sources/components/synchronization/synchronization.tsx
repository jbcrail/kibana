/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { useValues } from 'kea';

import { EuiCallOut, EuiLink, EuiPanel, EuiSwitch, EuiSpacer, EuiText } from '@elastic/eui';

import { ViewContentHeader } from '../../../../components/shared/view_content_header';
import { NAV } from '../../../../constants';
import { SYNCHRONIZATION_DOCS_URL } from '../../../../routes';
import {
  SOURCE_SYNCRONIZATION_DESCRIPTION,
  SYNCHRONIZATION_DISABLED_TITLE,
  SYNCHRONIZATION_DISABLED_DESCRIPTION,
  SOURCE_SYNCRONIZATION_TOGGLE_LABEL,
  SOURCE_SYNCRONIZATION_TOGGLE_DESCRIPTION,
  SYNCHRONIZATION_LINK_LABEL,
} from '../../constants';
import { SourceLogic } from '../../source_logic';
import { SourceLayout } from '../source_layout';

export const Synchronization: React.FC = () => {
  const {
    contentSource: { isSyncConfigEnabled },
  } = useValues(SourceLogic);

  const onChange = (checked: boolean) => `#TODO: ${checked}`;
  const syncToggle = (
    <EuiPanel hasBorder>
      <EuiSwitch
        label={SOURCE_SYNCRONIZATION_TOGGLE_LABEL}
        checked
        onChange={(e) => onChange(e.target.checked)}
      />
      <EuiSpacer size="m" />
      <EuiText size="s" color="subdued">
        {SOURCE_SYNCRONIZATION_TOGGLE_DESCRIPTION}
      </EuiText>
    </EuiPanel>
  );

  const syncDisabledCallout = (
    <EuiCallOut title={SYNCHRONIZATION_DISABLED_TITLE} color="warning" iconType="help">
      <p>{SYNCHRONIZATION_DISABLED_DESCRIPTION}</p>
    </EuiCallOut>
  );

  return (
    <SourceLayout
      pageChrome={[NAV.SYNCHRONIZATION]}
      pageViewTelemetry="source_synchronization"
      isLoading={false}
    >
      <ViewContentHeader
        title={NAV.SYNCHRONIZATION}
        description={SOURCE_SYNCRONIZATION_DESCRIPTION}
      />
      <EuiLink href={SYNCHRONIZATION_DOCS_URL} external>
        {SYNCHRONIZATION_LINK_LABEL}
      </EuiLink>
      <EuiSpacer />
      {isSyncConfigEnabled ? syncToggle : syncDisabledCallout}
    </SourceLayout>
  );
};
