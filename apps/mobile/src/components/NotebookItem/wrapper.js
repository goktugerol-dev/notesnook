import React from 'react';
import {NotebookItem} from '.';
import {useSelectionStore} from '../../provider/stores';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import {history} from '../../utils';
import {eOnNewTopicAdded, refreshNotesPage} from '../../utils/Events';
import SelectionWrapper from '../SelectionWrapper';

export const NotebookWrapper = React.memo(({item, index}) => {
  const isTrash = item.type === 'trash';
  const setSelectedItem = useSelectionStore(state => state.setSelectedItem);

  const onPress = () => {
    if (history.selectedItemsList.length > 0 && history.selectionMode) {
      setSelectedItem(item);
      return;
    } else {
      history.selectedItemsList = [];
    }
    let routeName = item.type === 'topic' ? 'NotesPage' : 'Notebook';

    let params =
      item.type === 'topic'
        ? {...item, menu: false}
        : {
            menu: false,
            notebook: item,
            title: item.title
          };
    let headerState = {
      heading: item.title,
      id: item.id,
      type: item.type
    };
    if (item.type === 'topic') {
      eSendEvent(refreshNotesPage, params);
    } else {
      eSendEvent(eOnNewTopicAdded, params);
    }
    Navigation.navigate(routeName, params, headerState);
  };
  return (
    <SelectionWrapper
      pinned={item.pinned}
      index={index}
      onPress={onPress}
      height={item.type === 'topic' ? 80 : 110}
      item={item}>
      <NotebookItem
        isTopic={item.type === 'topic'}
        item={item}
        index={index}
        isTrash={isTrash}
      />
    </SelectionWrapper>
  );
});
