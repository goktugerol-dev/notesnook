import React from 'react';
import NoteItem from '.';
import { notesnook } from '../../../../e2e/test.ids';
import { useEditorStore, useSelectionStore, useTrashStore } from '../../../stores/stores';
import { DDS } from '../../../services/device-detection';
import { eSendEvent, openVault, ToastEvent } from '../../../services/event-manager';
import Navigation from '../../../services/navigation';
import { history } from '../../../utils';
import { db } from '../../../utils/database';
import { eOnLoadNote, eShowMergeDialog } from '../../../utils/events';
import { tabBarRef } from '../../../utils/global-refs';
import { presentDialog } from '../../dialog/functions';
import SelectionWrapper from '../selection-wrapper';

const present = () =>
  presentDialog({
    title: 'Note not synced',
    negativeText: 'Ok',
    paragraph: 'Please sync again to open this note for editing'
  });

export const openNote = async (item, isTrash, setSelectedItem) => {
  let _note = item;

  if (!isTrash) {
    _note = db.notes.note(item.id).data;
    if (!db.notes.note(item.id)?.synced()) {
      present();
      return;
    }
  } else {
    if (!db.trash.synced(item.id)) {
      present();
      return;
    }
  }

  if (history.selectedItemsList.length > 0 && history.selectionMode) {
    setSelectedItem && setSelectedItem(_note);
    return;
  } else {
    history.selectedItemsList = [];
  }

  if (_note.conflicted) {
    eSendEvent(eShowMergeDialog, _note);
    return;
  }

  if (_note.locked) {
    openVault({
      item: _note,
      novault: true,
      locked: true,
      goToEditor: true,
      title: 'Open note',
      description: 'Unlock note to open it in editor.'
    });
    return;
  }
  if (isTrash) {
    presentDialog({
      title: `Restore ${item.itemType}`,
      paragraph: `Restore or delete ${item.itemType} forever`,
      positiveText: 'Restore',
      negativeText: 'Delete',
      positivePress: async () => {
        await db.trash.restore(item.id);
        Navigation.setRoutesToUpdate([
          Navigation.routeNames.Tags,
          Navigation.routeNames.Notes,
          Navigation.routeNames.Notebooks,
          Navigation.routeNames.NotesPage,
          Navigation.routeNames.Favorites,
          Navigation.routeNames.Trash
        ]);
        useSelectionStore.getState().setSelectionMode(false);
        ToastEvent.show({
          heading: 'Restore successful',
          type: 'success'
        });
      },
      onClose: async () => {
        await db.trash.delete(item.id);
        useTrashStore.getState().setTrash();
        useSelectionStore.getState().setSelectionMode(false);
        ToastEvent.show({
          heading: 'Permanantly deleted items',
          type: 'success',
          context: 'local'
        });
      }
    });
  } else {
    useEditorStore.getState().setReadonly(_note?.readonly);
    eSendEvent(eOnLoadNote, _note);
    if (!DDS.isTab) {
      tabBarRef.current?.goToPage(1);
    }
  }
};

export const NoteWrapper = React.memo(
  ({ item, index, tags, dateBy }) => {
    const isTrash = item.type === 'trash';
    const setSelectedItem = useSelectionStore(state => state.setSelectedItem);

    return (
      <SelectionWrapper
        index={index}
        height={100}
        testID={notesnook.ids.note.get(index)}
        onPress={() => openNote(item, isTrash, setSelectedItem)}
        item={item}
      >
        <NoteItem item={item} dateBy={dateBy} tags={tags} isTrash={isTrash} />
      </SelectionWrapper>
    );
  },
  (prev, next) => {
    if (prev.dateBy !== next.dateBy) {
      return false;
    }
    if (prev.item?.dateEdited !== next.item?.dateEdited) {
      return false;
    }

    if (JSON.stringify(prev.tags) !== JSON.stringify(next.tags)) {
      return false;
    }

    if (prev.item !== next.item) {
      return false;
    }

    return true;
  }
);
