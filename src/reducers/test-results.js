const SET_OPENED = 'scratch-gui/test-results/SET_OPENED';

const initialState = {
    openedMap: {} // map of nodeId to boolean
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SET_OPENED:
        return Object.assign({}, state, {
            // change the value of the node id to action.opened
            openedMap: Object.assign({}, state.openedMap, {
                [action.nodeId]: action.opened
            })
        });
    default:
        return state;
    }
};

const setOpened = function (value, nodeId) {
    return {
        type: SET_OPENED,
        opened: value,
        nodeId: nodeId
    };
};

export {
    reducer as default,
    initialState as testResultsInitialState,
    setOpened
};
