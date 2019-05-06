import AbstractInputHandler from 'util/input/AbstractInputHandler.js';
import {EVENT_SOURCE_NODE} from 'graph/inputs/GraphNodeInputHandler.js';

export const GRAPH_EVENT_NODE_ACCEPT_CHANGE = 'node-accept-change';

class FSANodeInputHandler extends AbstractInputHandler
{
	constructor(inputController, graphController)
	{
		super();

		this._inputController = inputController;
		this._graphController = graphController;
	}

	/** @override */
	onInputEvent(pointer)
	{
		const inputController = this._inputController;
		const currentTargetType = inputController.getCurrentTargetType();
		if (currentTargetType === EVENT_SOURCE_NODE)
		{
			const currentTargetSource = inputController.getCurrentTargetSource();
			currentTargetSource.setNodeAccept(!currentTargetSource.getNodeAccept());

			graphController.emitGraphEvent(GRAPH_EVENT_NODE_ACCEPT_CHANGE, {target: currentTargetSource});
		}
	}
}

export default FSANodeInputHandler;