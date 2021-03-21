/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 */
import mxRectangle from "./mxRectangle";
import mxCellHighlight from "../handler/mxCellHighlight";
import mxUtils from "./mxUtils";

class mxDragSource {
  /**
   * Variable: element
   *
   * Reference to the DOM node which was made draggable.
   */
  element = null;

  /**
   * Variable: dropHandler
   *
   * Holds the DOM node that is used to represent the drag preview. If this is
   * null then the source element will be cloned and used for the drag preview.
   */
  dropHandler = null;

  /**
   * Variable: dragOffset
   *
   * <mxPoint> that specifies the offset of the <dragElement>. Default is null.
   */
  dragOffset = null;

  /**
   * Variable: dragElement
   *
   * Holds the DOM node that is used to represent the drag preview. If this is
   * null then the source element will be cloned and used for the drag preview.
   */
  dragElement = null;

  /**
   * Variable: previewElement
   *
   * Optional <mxRectangle> that specifies the unscaled size of the preview.
   */
  previewElement = null;

  /**
   * Variable: previewOffset
   *
   * Optional <mxPoint> that specifies the offset of the preview in pixels.
   */
  previewOffset = null;

  /**
   * Variable: enabled
   *
   * Specifies if this drag source is enabled. Default is true.
   */
  enabled = true;

  /**
   * Variable: currentGraph
   *
   * Reference to the <mxGraph> that is the current drop target.
   */
  currentGraph = null;

  /**
   * Variable: currentDropTarget
   *
   * Holds the current drop target under the mouse.
   */
  currentDropTarget = null;

  /**
   * Variable: currentPoint
   *
   * Holds the current drop location.
   */
  currentPoint = null;

  /**
   * Variable: currentGuide
   *
   * Holds an <mxGuide> for the <currentGraph> if <dragPreview> is not null.
   */
  currentGuide = null;

  /**
   * Variable: currentGuide
   *
   * Holds an <mxGuide> for the <currentGraph> if <dragPreview> is not null.
   */
  currentHighlight = null;

  /**
   * Variable: autoscroll
   *
   * Specifies if the graph should scroll automatically. Default is true.
   */
  autoscroll = true;

  /**
   * Variable: guidesEnabled
   *
   * Specifies if <mxGuide> should be enabled. Default is true.
   */
  guidesEnabled = true;

  /**
   * Variable: gridEnabled
   *
   * Specifies if the grid should be allowed. Default is true.
   */
  gridEnabled = true;

  /**
   * Variable: highlightDropTargets
   *
   * Specifies if drop targets should be highlighted. Default is true.
   */
  highlightDropTargets = true;

  /**
   * Variable: dragElementZIndex
   *
   * ZIndex for the drag element. Default is 100.
   */
  dragElementZIndex = 100;

  /**
   * Variable: dragElementOpacity
   *
   * Opacity of the drag element in %. Default is 70.
   */
  dragElementOpacity = 70;

  /**
   * Variable: checkEventSource
   *
   * Whether the event source should be checked in <graphContainerEvent>. Default
   * is true.
   */
  checkEventSource = true;

  /**
   * Class: mxDragSource
   *
   * Wrapper to create a drag source from a DOM element so that the element can
   * be dragged over a graph and dropped into the graph as a new cell.
   *
   * Problem is that in the dropHandler the current preview location is not
   * available, so the preview and the dropHandler must match.
   *
   * Constructor: mxDragSource
   *
   * Constructs a new drag source for the given element.
   */
  constructor(element, dropHandler) {
    this.element = element;
    this.dropHandler = dropHandler;

    // Handles a drag gesture on the element
    mxEvent.addGestureListeners(element, (evt) => {
      this.mouseDown(evt);
    });

    // Prevents native drag and drop
    mxEvent.addListener(element, 'dragstart', (evt) => {
      mxEvent.consume(evt);
    });

    this.eventConsumer = (sender, evt) => {
      let evtName = evt.getProperty('eventName');
      let me = evt.getProperty('event');

      if (evtName != mxEvent.MOUSE_DOWN) {
        me.consume();
      }
    };
  };

  /**
   * Function: isEnabled
   *
   * Returns <enabled>.
   */
  isEnabled = () => {
    return this.enabled;
  };

  /**
   * Function: setEnabled
   *
   * Sets <enabled>.
   */
  setEnabled = (value) => {
    this.enabled = value;
  };

  /**
   * Function: isGuidesEnabled
   *
   * Returns <guidesEnabled>.
   */
  isGuidesEnabled = () => {
    return this.guidesEnabled;
  };

  /**
   * Function: setGuidesEnabled
   *
   * Sets <guidesEnabled>.
   */
  setGuidesEnabled = (value) => {
    this.guidesEnabled = value;
  };

  /**
   * Function: isGridEnabled
   *
   * Returns <gridEnabled>.
   */
  isGridEnabled = () => {
    return this.gridEnabled;
  };

  /**
   * Function: setGridEnabled
   *
   * Sets <gridEnabled>.
   */
  setGridEnabled = (value) => {
    this.gridEnabled = value;
  };

  /**
   * Function: getGraphForEvent
   *
   * Returns the graph for the given mouse event. This implementation returns
   * null.
   */
  getGraphForEvent = (evt) => {
    return null;
  };

  /**
   * Function: getDropTarget
   *
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses <mxGraph.getCellAt>.
   */
  getDropTarget = (graph, x, y, evt) => {
    return graph.getCellAt(x, y);
  };

  /**
   * Function: createDragElement
   *
   * Creates and returns a clone of the <dragElementPrototype> or the <element>
   * if the former is not defined.
   */
  createDragElement = (evt) => {
    return this.element.cloneNode(true);
  };

  /**
   * Function: createPreviewElement
   *
   * Creates and returns an element which can be used as a preview in the given
   * graph.
   */
  createPreviewElement = (graph) => {
    return null;
  };

  /**
   * Function: isActive
   *
   * Returns true if this drag source is active.
   */
  isActive = () => {
    return this.mouseMoveHandler != null;
  };

  /**
   * Function: reset
   *
   * Stops and removes everything and restores the state of the object.
   */
  reset = () => {
    if (this.currentGraph != null) {
      this.dragExit(this.currentGraph);
      this.currentGraph = null;
    }

    this.removeDragElement();
    this.removeListeners();
    this.stopDrag();
  };

  /**
   * Function: mouseDown
   *
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses <mxGraph.getCellAt>.
   *
   * To ignore popup menu events for a drag source, this function can be
   * overridden as follows.
   *
   * (code)
   * let mouseDown = dragSource.mouseDown;
   *
   * dragSource.mouseDown = (evt)=>
   * {
   *   if (!mxEvent.isPopupTrigger(evt))
   *   {
   *     mouseDown.apply(this, arguments);
   *   }
   * };
   * (end)
   */
  mouseDown = (evt) => {
    if (this.enabled && !mxEvent.isConsumed(evt) && this.mouseMoveHandler == null) {
      this.startDrag(evt);
      this.mouseMoveHandler = this.mouseMove.bind(this);
      this.mouseUpHandler = this.mouseUp.bind(this);
      mxEvent.addGestureListeners(document, null, this.mouseMoveHandler, this.mouseUpHandler);

      if (mxClient.IS_TOUCH && !mxEvent.isMouseEvent(evt)) {
        this.eventSource = mxEvent.getSource(evt);
        mxEvent.addGestureListeners(this.eventSource, null, this.mouseMoveHandler, this.mouseUpHandler);
      }
    }
  };

  /**
   * Function: startDrag
   *
   * Creates the <dragElement> using <createDragElement>.
   */
  startDrag = (evt) => {
    this.dragElement = this.createDragElement(evt);
    this.dragElement.style.position = 'absolute';
    this.dragElement.style.zIndex = this.dragElementZIndex;
    mxUtils.setOpacity(this.dragElement, this.dragElementOpacity);

    if (this.checkEventSource && mxClient.IS_SVG) {
      this.dragElement.style.pointerEvents = 'none';
    }
  };

  /**
   * Function: stopDrag
   *
   * Invokes <removeDragElement>.
   */
  stopDrag = () => {
    // LATER: This used to have a mouse event. If that is still needed we need to add another
    // final call to the DnD protocol to add a cleanup step in the case of escape press, which
    // is not associated with a mouse event and which currently calles this method.
    this.removeDragElement();
  };

  /**
   * Function: removeDragElement
   *
   * Removes and destroys the <dragElement>.
   */
  removeDragElement = () => {
    if (this.dragElement != null) {
      if (this.dragElement.parentNode != null) {
        this.dragElement.parentNode.removeChild(this.dragElement);
      }

      this.dragElement = null;
    }
  };

  /**
   * Function: getElementForEvent
   *
   * Returns the topmost element under the given event.
   */
  getElementForEvent = (evt) => {
    return ((mxEvent.isTouchEvent(evt) || mxEvent.isPenEvent(evt)) ?
        document.elementFromPoint(mxEvent.getClientX(evt), mxEvent.getClientY(evt)) :
        mxEvent.getSource(evt));
  };

  /**
   * Function: graphContainsEvent
   *
   * Returns true if the given graph contains the given event.
   */
  graphContainsEvent = (graph, evt) => {
    let x = mxEvent.getClientX(evt);
    let y = mxEvent.getClientY(evt);
    let offset = mxUtils.getOffset(graph.container);
    let origin = mxUtils.getScrollOrigin();
    let elt = this.getElementForEvent(evt);

    if (this.checkEventSource) {
      while (elt != null && elt != graph.container) {
        elt = elt.parentNode;
      }
    }

    // Checks if event is inside the bounds of the graph container
    return elt != null && x >= offset.x - origin.x && y >= offset.y - origin.y &&
        x <= offset.x - origin.x + graph.container.offsetWidth &&
        y <= offset.y - origin.y + graph.container.offsetHeight;
  };

  /**
   * Function: mouseMove
   *
   * Gets the graph for the given event using <getGraphForEvent>, updates the
   * <currentGraph>, calling <dragEnter> and <dragExit> on the new and old graph,
   * respectively, and invokes <dragOver> if <currentGraph> is not null.
   */
  mouseMove = (evt) => {
    let graph = this.getGraphForEvent(evt);

    // Checks if event is inside the bounds of the graph container
    if (graph != null && !this.graphContainsEvent(graph, evt)) {
      graph = null;
    }

    if (graph != this.currentGraph) {
      if (this.currentGraph != null) {
        this.dragExit(this.currentGraph, evt);
      }

      this.currentGraph = graph;

      if (this.currentGraph != null) {
        this.dragEnter(this.currentGraph, evt);
      }
    }

    if (this.currentGraph != null) {
      this.dragOver(this.currentGraph, evt);
    }

    if (this.dragElement != null && (this.previewElement == null || this.previewElement.style.visibility != 'visible')) {
      let x = mxEvent.getClientX(evt);
      let y = mxEvent.getClientY(evt);

      if (this.dragElement.parentNode == null) {
        document.body.appendChild(this.dragElement);
      }

      this.dragElement.style.visibility = 'visible';

      if (this.dragOffset != null) {
        x += this.dragOffset.x;
        y += this.dragOffset.y;
      }

      let offset = mxUtils.getDocumentScrollOrigin(document);

      this.dragElement.style.left = (x + offset.x) + 'px';
      this.dragElement.style.top = (y + offset.y) + 'px';
    } else if (this.dragElement != null) {
      this.dragElement.style.visibility = 'hidden';
    }

    mxEvent.consume(evt);
  };

  /**
   * Function: mouseUp
   *
   * Processes the mouse up event and invokes <drop>, <dragExit> and <stopDrag>
   * as required.
   */
  mouseUp = (evt) => {
    if (this.currentGraph != null) {
      if (this.currentPoint != null && (this.previewElement == null ||
          this.previewElement.style.visibility != 'hidden')) {
        let scale = this.currentGraph.view.scale;
        let tr = this.currentGraph.view.translate;
        let x = this.currentPoint.x / scale - tr.x;
        let y = this.currentPoint.y / scale - tr.y;

        this.drop(this.currentGraph, evt, this.currentDropTarget, x, y);
      }

      this.dragExit(this.currentGraph);
      this.currentGraph = null;
    }

    this.stopDrag();
    this.removeListeners();

    mxEvent.consume(evt);
  };

  /**
   * Function: removeListeners
   *
   * Actives the given graph as a drop target.
   */
  removeListeners = () => {
    if (this.eventSource != null) {
      mxEvent.removeGestureListeners(this.eventSource, null, this.mouseMoveHandler, this.mouseUpHandler);
      this.eventSource = null;
    }

    mxEvent.removeGestureListeners(document, null, this.mouseMoveHandler, this.mouseUpHandler);
    this.mouseMoveHandler = null;
    this.mouseUpHandler = null;
  };

  /**
   * Function: dragEnter
   *
   * Actives the given graph as a drop target.
   */
  dragEnter = (graph, evt) => {
    graph.isMouseDown = true;
    graph.isMouseTrigger = mxEvent.isMouseEvent(evt);
    this.previewElement = this.createPreviewElement(graph);

    if (this.previewElement != null && this.checkEventSource && mxClient.IS_SVG) {
      this.previewElement.style.pointerEvents = 'none';
    }

    // Guide is only needed if preview element is used
    if (this.isGuidesEnabled() && this.previewElement != null) {
      this.currentGuide = new mxGuide(graph, graph.graphHandler.getGuideStates());
    }

    if (this.highlightDropTargets) {
      this.currentHighlight = new mxCellHighlight(graph, mxConstants.DROP_TARGET_COLOR);
    }

    // Consumes all events in the current graph before they are fired
    graph.addListener(mxEvent.FIRE_MOUSE_EVENT, this.eventConsumer);
  };

  /**
   * Function: dragExit
   *
   * Deactivates the given graph as a drop target.
   */
  dragExit = (graph, evt) => {
    this.currentDropTarget = null;
    this.currentPoint = null;
    graph.isMouseDown = false;

    // Consumes all events in the current graph before they are fired
    graph.removeListener(this.eventConsumer);

    if (this.previewElement != null) {
      if (this.previewElement.parentNode != null) {
        this.previewElement.parentNode.removeChild(this.previewElement);
      }

      this.previewElement = null;
    }

    if (this.currentGuide != null) {
      this.currentGuide.destroy();
      this.currentGuide = null;
    }

    if (this.currentHighlight != null) {
      this.currentHighlight.destroy();
      this.currentHighlight = null;
    }
  };

  /**
   * Function: dragOver
   *
   * Implements autoscroll, updates the <currentPoint>, highlights any drop
   * targets and updates the preview.
   */
  dragOver = (graph, evt) => {
    let offset = mxUtils.getOffset(graph.container);
    let origin = mxUtils.getScrollOrigin(graph.container);
    let x = mxEvent.getClientX(evt) - offset.x + origin.x - graph.panDx;
    let y = mxEvent.getClientY(evt) - offset.y + origin.y - graph.panDy;

    if (graph.autoScroll && (this.autoscroll == null || this.autoscroll)) {
      graph.scrollPointToVisible(x, y, graph.autoExtend);
    }

    // Highlights the drop target under the mouse
    if (this.currentHighlight != null && graph.isDropEnabled()) {
      this.currentDropTarget = this.getDropTarget(graph, x, y, evt);
      let state = graph.getView().getState(this.currentDropTarget);
      this.currentHighlight.highlight(state);
    }

    // Updates the location of the preview
    if (this.previewElement != null) {
      if (this.previewElement.parentNode == null) {
        graph.container.appendChild(this.previewElement);

        this.previewElement.style.zIndex = '3';
        this.previewElement.style.position = 'absolute';
      }

      let gridEnabled = this.isGridEnabled() && graph.isGridEnabledEvent(evt);
      let hideGuide = true;

      // Grid and guides
      if (this.currentGuide != null && this.currentGuide.isEnabledForEvent(evt)) {
        // LATER: HTML preview appears smaller than SVG preview
        let w = parseInt(this.previewElement.style.width);
        let h = parseInt(this.previewElement.style.height);
        let bounds = new mxRectangle(0, 0, w, h);
        let delta = new mxPoint(x, y);
        delta = this.currentGuide.move(bounds, delta, gridEnabled, true);
        hideGuide = false;
        x = delta.x;
        y = delta.y;
      } else if (gridEnabled) {
        let scale = graph.view.scale;
        let tr = graph.view.translate;
        let off = graph.gridSize / 2;
        x = (graph.snap(x / scale - tr.x - off) + tr.x) * scale;
        y = (graph.snap(y / scale - tr.y - off) + tr.y) * scale;
      }

      if (this.currentGuide != null && hideGuide) {
        this.currentGuide.hide();
      }

      if (this.previewOffset != null) {
        x += this.previewOffset.x;
        y += this.previewOffset.y;
      }

      this.previewElement.style.left = Math.round(x) + 'px';
      this.previewElement.style.top = Math.round(y) + 'px';
      this.previewElement.style.visibility = 'visible';
    }

    this.currentPoint = new mxPoint(x, y);
  };

  /**
   * Function: drop
   *
   * Returns the drop target for the given graph and coordinates. This
   * implementation uses <mxGraph.getCellAt>.
   */
  drop = (graph, evt, dropTarget, x, y) => {
    this.dropHandler(graph, evt, dropTarget, x, y);

    // Had to move this to after the insert because it will
    // affect the scrollbars of the window in IE to try and
    // make the complete container visible.
    // LATER: Should be made optional.
    if (graph.container.style.visibility !== 'hidden') {
      graph.container.focus();
    }
  };
}

export default mxDragSource;
