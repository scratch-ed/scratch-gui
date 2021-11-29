import React from 'react';
import {connect} from 'react-redux';
import omit from 'lodash.omit';

const DebuggerAnimationHOC = function (WrappedComponent) {
    class DebuggerAnimationWrapper extends React.Component {
        constructor (props) {
            super(props);

            // The time interval after which the animation must be updated (in ms).
            this.ANIMATION_INTERVAL = 100;
        }


        render () {
            const componentProps = omit(this.props, [

            ]);

            return (
                <WrappedComponent {...componentProps} />
            );
        }
    }

    const mapStateToProps = state => ({});

    const mapDispatchToProps = dispatch => ({});

    return connect(
        mapStateToProps,
        mapDispatchToProps
    )(DebuggerAnimationWrapper);
};
