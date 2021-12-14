/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

import React, { PureComponent } from 'react';

import classNames from 'classnames';

import { isFunction } from 'min-dash';

import dragger from '../../util/dom/dragger';

import css from './PropertiesContainer.less';

import HandleBar from '../../../resources/icons/HandleBar.svg';

import { throttle } from '../../util';

export const DEFAULT_LAYOUT = {
  open: false,
  width: 250
};

export const MIN_WIDTH = 250;

/**
 * Container for properties panel that can be resized and toggled.
 */
class PropertiesContainerWrapped extends PureComponent {
  constructor(props) {
    super(props);

    this.handlePanelResize = throttle(this.handlePanelResize);

    window.addEventListener('resize', this.handleResize);

    this.containerRef = new React.createRef();
    this.resizeHandlerRef = new React.createRef();

    this.context = {};
  }

  handleResizeStart = (event) => {
    const onDragStart = dragger(this.handlePanelResize);

    onDragStart(event);

    let {
      open,
      width,
      fullWidth
    } = getLayoutFromProps(this.props);

    this.context = {
      open,
      startWidth: width,
      fullWidth
    };
  }

  handleResize = () => {
    const width = getCurrentWidth(this.containerRef.current);

    if (width >= getMaxWidth()) {

      const newWidth = getWindowWidth();
      this.containerRef.current.style.width = `${newWidth}px`;

      this.changeLayout({
        propertiesPanel: {
          open: true,
          width: newWidth,
          fullWidth: true
        }
      });
    }
  }

  handlePanelResize = (_, delta) => {
    const { x: dx } = delta;

    if (dx === 0) {
      return;
    }

    const { startWidth } = this.context;

    const {
      open,
      width,
      fullWidth
    } = getLayout(dx, startWidth);

    this.context = {
      ...this.context,
      open,
      width,
      fullWidth
    };

    const styledWidth = open ? `${width}px` : 0;

    if (this.containerRef.current) {
      this.containerRef.current.classList.toggle('open', open);
      this.containerRef.current.style.width = styledWidth;
    }

    if (this.resizeHandlerRef.current) {
      adjustResizeHandleStyles(this.resizeHandlerRef.current, this.context);
    }
  }

  handleResizeEnd = () => {
    const {
      open,
      width,
      fullWidth
    } = this.context;

    this.context = {};

    this.changeLayout({
      propertiesPanel: {
        open,
        width,
        fullWidth
      }
    });
  }

  handleToggle = () => {
    const { layout = {} } = this.props;

    const { propertiesPanel = {} } = layout;

    this.changeLayout({
      propertiesPanel: {
        ...DEFAULT_LAYOUT,
        ...propertiesPanel,
        open: !propertiesPanel.open
      }
    });
  }

  changeLayout = (layout = {}) => {
    const { onLayoutChanged } = this.props;

    if (isFunction(onLayoutChanged)) {
      onLayoutChanged(layout);
    }
  }

  render() {
    const {
      className,
      forwardedRef
    } = this.props;

    let {
      open,
      width
    } = getLayoutFromProps(this.props);

    return (
      <div
        ref={ this.containerRef }
        className={ classNames(
          css.PropertiesContainer,
          className,
          { open }
        ) }
        style={ { width } }>

        <div
          ref={ this.resizeHandlerRef }
          className="resize-handle"
          draggable
          onDragStart={ this.handleResizeStart }
          onDragEnd={ this.handleResizeEnd }
        ></div>

        <div
          className="toggle"
          onClick={ this.handleToggle }
        >
          {!open && <HandleBar />}
        </div>

        <div className="properties-container" ref={ forwardedRef }></div>
      </div>
    );
  }

}

export default React.forwardRef(
  function PropertiesContainer(props, ref) {
    return <PropertiesContainerWrapped { ...props } forwardedRef={ ref } />;
  }
);

// helpers //////////

function getLayout(dx, initialWidth) {
  let width = initialWidth - dx;

  const open = width >= MIN_WIDTH;
  const fullWidth = width >= getMaxWidth();
  fullWidth ? width = window.innerWidth : null;

  if (!open) {
    width = DEFAULT_LAYOUT.width;
  }

  return {
    open,
    fullWidth,
    width
  };
}

function getLayoutFromProps(props) {
  const layout = props.layout || {};

  const propertiesPanel = layout.propertiesPanel || DEFAULT_LAYOUT;

  const { open, fullWidth } = propertiesPanel;

  const width = open ? propertiesPanel.width : 0;

  return {
    open,
    width,
    fullWidth
  };
}

function adjustResizeHandleStyles(handle, context) {
  const {
    open,
    fullWidth
  } = context;

  handle.classList.remove('snapped-right');
  handle.classList.remove('snapped-left');

  if (!open)
    handle.classList.add('snapped-right');

  if (fullWidth)
    handle.classList.add('snapped-left');

}

function getWindowWidth() {
  return window.innerWidth;
}

function getMaxWidth() {
  return getWindowWidth() * 0.8;
}

function getCurrentWidth(panel) {
  const styledWidth = panel.style.width;
  return parseInt(styledWidth.substring(0, styledWidth.length - 2));
}