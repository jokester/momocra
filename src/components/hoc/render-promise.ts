import React from 'react';
import { usePromised } from '@jokester/ts-commonutil/react/hook/use-promised';

interface RenderPromiseProps<T> extends React.PropsWithChildren<{}> {
  promise: Promise<T>;
  onPending?(): React.ReactElement;
  onReject?(e: unknown): React.ReactElement;
  children(value: T): React.ReactElement;
}

export function RenderPromise<T>(props: RenderPromiseProps<T>): React.ReactElement {
  const promised = usePromised(props.promise);

  if (promised.fulfilled) {
    return props.children(promised.value);
  } else if (promised.pending) {
    return (props.onPending?.() || null) as React.ReactElement;
  } else {
    return (props.onReject?.(promised.reason) || null) as React.ReactElement;
  }
}
