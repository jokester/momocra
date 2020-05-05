import React, { useMemo } from 'react';
import Link from 'next/link';
import { TypedRoutes } from '../../typed-routes';
import { ItemsV3Json } from '../../items-db/json-schema';
import { CollectionStateSwitch } from './collection-state-switch';
import { ItemUtils } from '../../items-db/item-utils';
import { CollectionStateMap } from '../hooks/use-collections-api';
import { createLogger } from '../../util/debug-logger';
import { useVisible } from '../generic-hooks/use-visible';

const logger = createLogger(__filename);

export const InventoryCard: React.FunctionComponent<{
  item: ItemsV3Json.Item;
  collectionMap: null | CollectionStateMap;
  lazyLoad: boolean;
}> = ({ item, collectionMap, lazyLoad }) => {
  const title = useMemo(() => ItemUtils.extractDisplayName(item), [item]);

  const [ref, visible] = useVisible<HTMLDivElement>(!lazyLoad);

  logger('visible', visible, item);

  return (
    <div className="inline-block my-2 w-full sm:w-1/2 md:w-1/3 lg:w-1/5 h-40" ref={ref}>
      {visible && (
        <div className="bg-blue-100 border border-solid border-blue-300 my-1 mx-2 h-full flex-col rounded-lg p-2">
          <div className="flex justify-between align-baseline">
            <h3 className="text-xl inline-block">{title}</h3>
            <Link href={TypedRoutes.items.show2(item)} as={TypedRoutes.items.showTemplate}>
              查看详细
            </Link>
          </div>
          <div className="flex mt-2 justify-around">
            <img
              src="https://dummyimage.com/400x300/cff/000"
              alt="image"
              className="max-h-full h-20 object-cover inline-block bg-blue-200 mr-2"
            />
            <CollectionStateSwitch item={item} collectionMap={collectionMap} />
          </div>
        </div>
      )}
    </div>
  );
};

export const DummyModelListHeader: React.FunctionComponent<{ title: string }> = ({ title }) => (
  <h3 className="px-2 my-1 font-bold ">{title}</h3>
);

export const InventoryCartListView: React.FC = props => {
  return <div className="flex flex-wrap mx-2 -mt-2 z-0">{props.children}</div>;
};
