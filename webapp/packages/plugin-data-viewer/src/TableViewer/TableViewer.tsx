/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { PropsWithChildren, useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Loader, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DataPresentationService } from '../DataPresentationService';
import { TableFooter } from './TableFooter/TableFooter';
import { TableGrid } from './TableGrid';
import { TableHeader } from './TableHeader/TableHeader';
import { TableLeftBar } from './TableLeftBar/TableLeftBar';
import { TableViewerStorageService } from './TableViewerStorageService';

const viewerStyles = css`
  table-viewer {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  table-content {
    display: flex;
    flex: 1;
    overflow: hidden;
  }
  table-data, table-box {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
  }
`;

type TableViewerProps = PropsWithChildren<{
  tableId: string;
  resultIndex: number | undefined;
  presentationId: string | undefined;
  className?: string;
  onPresentationChange: (id: string) => void;
}>;

export const TableViewer = observer(function TableViewer({
  tableId,
  resultIndex = 0,
  presentationId,
  className,
  onPresentationChange,
}: TableViewerProps) {
  const dataPresentationService = useService(DataPresentationService);
  const tableViewerStorageService = useService(TableViewerStorageService);
  const dataModel = tableViewerStorageService.get(tableId);
  const result = dataModel?.getResult(resultIndex);

  const handlePresentationChange = useCallback((id: string) => {
    const presentation = dataPresentationService.get(id);
    if (presentation) {
      if (presentation.dataFormat !== dataModel?.source.dataFormat) {
        dataModel?.setDataFormat(presentation.dataFormat)
          .reload();
      }
      onPresentationChange(id);
    }
  }, [onPresentationChange, dataModel]);

  if (!dataModel) {
    return <Loader />;
  }

  const dataFormat = result?.dataFormat || ResultDataFormat.Resultset;
  const presentation = dataPresentationService.getSupported(
    dataFormat,
    presentationId
  );

  if (!presentation) {
    return <TextPlaceholder>There are no available presentation for data format: {dataFormat}</TextPlaceholder>;
  }

  return styled(viewerStyles)(
    <table-viewer as="div" className={className}>
      <TableHeader model={dataModel} />
      <table-content as='div'>
        <TableLeftBar
          presentationId={presentation.id}
          supportedDataFormat={dataModel.supportedDataFormats}
          model={dataModel}
          onPresentationChange={handlePresentationChange}
        />
        <table-data as='div'>
          <table-box as='div'>
            <TableGrid
              model={dataModel}
              dataFormat={dataFormat}
              presentation={presentation}
              resultIndex={resultIndex}
            />
          </table-box>
          <TableFooter model={dataModel} resultIndex={resultIndex} />
        </table-data>
      </table-content>
      <Loader
        loading={dataModel.isLoading()}
        cancelDisabled={!dataModel.source.canCancel}
        overlay
        onCancel={() => dataModel.source.cancel()}
      />
    </table-viewer>
  );
});
