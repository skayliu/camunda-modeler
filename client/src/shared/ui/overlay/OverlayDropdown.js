/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { useState } from 'react';
import classNames from 'classnames';

import { map } from 'min-dash';

import { Overlay, Section } from '..';

import css from './OverlayDropdown.less';

/**
 * @typedef {{ text: String, onClick: Function, icon?: React.Component }} Item
 */

/**
 * @typedef {{ key: String, label: String, items: Array<Item> }} ItemGroup
 */


/**
 * Dropdown displayed as an overlay.
 * @param {Object} props
 * @param {Node} props.buttonRef
 * @param {React.ReactChildren} props.children
 * @param {String} [props.className]
 * @param {Array<Item> | Array<ItemGroup>} props.items
 * @param {Function} [props.onClose]
 * @param {Object} [props.overlayConfig]
 * @param {Boolean} [props.overlayState]
 */
export function OverlayDropdown(props) {
  const {
    buttonRef,
    children,
    className = '',
    items,
    onClose,
    shouldOpen,
    overlayConfig,
    overlayState,
    ...restProps
  } = props;

  const [ open, setOpen ] = useState(false);

  React.useEffect(() => {
    setOpen(shouldOpen);
  }, [ shouldOpen ]);

  const toggle = () => {
    if (!overlayState) {
      setOpen(open => !open);
    } else {
      onClose();
    }
  };

  const close = () => {
    setOpen(false);
    onClose && onClose();
  };

  const onSelect = item => {
    item.onClick();
    close();
  };

  return (
    <React.Fragment>
      <button
        { ...restProps }
        onClick={ toggle }
        className={ classNames(className, 'btn', { 'btn--active': open }) }
        ref={ buttonRef }
        type="button"
      >
        { children }
      </button>
      { open && (
        <Overlay
          { ...overlayConfig }
          className={ css.OverlayDropdown }
          onClose={ close }
          anchor={ buttonRef.current }>
          {
            isGrouped(items) ? (
              map(items, (group) =>
                <OptionGroup
                  key={ group.key }
                  label={ group.label }
                  items={ group.items }
                  onSelect={ onSelect } />
              )
            ) : (
              <Section>
                <Options items={ items } onSelect={ onSelect } />
              </Section>
            )
          }
        </Overlay>
      ) }
    </React.Fragment>
  );
}

function OptionGroup(props) {
  const {
    items,
    label,
    onSelect
  } = props;

  return (
    <Section>
      <Section.Header>
        { label }
      </Section.Header>
      <Options items={ items } onSelect={ onSelect }></Options>
    </Section>
  );
}

function Options(props) {
  const { items, onSelect } = props;

  const focusRef = useArrowNavigation();

  return (
    <Section.Body>
      <ul ref={ focusRef }>
        {
          items.map((item, index) =>
            <Option
              key={ index }
              icon={ item.icon }
              text={ item.text }
              onClick={ () => onSelect(item) } />
          )
        }
      </ul>
    </Section.Body>
  );
}

function Option(props) {
  const {
    onClick,
    text,
    icon: IconComponent
  } = props;

  return (
    <li onClick={ onClick }>
      <button type="button" title={ text }>
        { IconComponent && <IconComponent /> }
        { text }
      </button>
    </li>
  );
}


// helper ///////////

function isGrouped(items) {
  return items.length && items[0].key;
}

function useArrowNavigation() {
  const ref = React.createRef(0);

  const handleKeydown = (event) => {
    const {
      key,
      keyCode,
      currentTarget
    } = event;

    if (key === 'ArrowDown' && keyCode == 40) {
      focusNext(currentTarget);
    } else if (key === 'ArrowUp' && keyCode == 38) {
      focusPrevious(currentTarget);
    }
  };

  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    const items = ref.current.querySelectorAll('li');

    items.forEach(i => i.addEventListener('keydown', handleKeydown));

    return () => {
      items.forEach(i => i.removeEventListener('keydown', handleKeydown));
    };

  }, [ ref.current ]);

  return ref;
}

/**
 *
 * @param {Node} focusElement
 */
function focusNext(focusElement) {
  const nextSibling = focusElement.nextSibling;

  // (1) focus immediate neighbor
  if (nextSibling) {
    return nextSibling.querySelector('button').focus();
  }

  // (2) try to find neighbor in other section
  const nextSection = focusElement.closest('section').nextElementSibling;
  return nextSection && nextSection.querySelector('li button').focus();
}

/**
 *
 * @param {Node} focusElement
 */
function focusPrevious(focusElement) {
  const previousSibling = focusElement.previousSibling;

  // (1) focus immediate neighbor
  if (previousSibling) {
    return previousSibling.querySelector('button').focus();
  }

  // (2) try to find neighbor in other section
  const previousSection = focusElement.closest('section').previousElementSibling;
  return previousSection && previousSection.querySelector('li:last-child button').focus();
}