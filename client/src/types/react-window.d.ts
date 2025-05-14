declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps {
    index: number;
    style: React.CSSProperties;
  }

  export interface FixedSizeListProps {
    children: React.ComponentType<ListChildComponentProps>;
    height: number;
    width: number;
    itemCount: number;
    itemSize: number;
    onItemsRendered?: (props: {
      overscanStartIndex: number;
      overscanStopIndex: number;
      visibleStartIndex: number;
      visibleStopIndex: number;
    }) => void;
  }

  export class FixedSizeList extends React.Component<FixedSizeListProps> {}
}

declare module 'react-window-infinite-loader' {
  import * as React from 'react';

  export interface InfiniteLoaderProps {
    isItemLoaded: (index: number) => boolean;
    itemCount: number;
    loadMoreItems: (
      startIndex: number,
      stopIndex: number
    ) => Promise<void> | void;
    threshold?: number;
    children: (props: {
      onItemsRendered: (props: {
        visibleStartIndex: number;
        visibleStopIndex: number;
      }) => void;
      ref: React.Ref<FixedSizeList>;
    }) => React.ReactNode;
  }

  export default class InfiniteLoader extends React.Component<InfiniteLoaderProps> {}
}

declare module 'react-virtualized-auto-sizer' {
  import * as React from 'react';

  export interface AutoSizerProps {
    children: (size: { width: number; height: number }) => React.ReactNode;
  }

  export default class AutoSizer extends React.Component<AutoSizerProps> {}
}
