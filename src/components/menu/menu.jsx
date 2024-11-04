import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './menu.css';
import {connect} from 'react-redux';
import {TimeSliderMode, TimeSliderStates} from '../../reducers/time-slider.js';

const MenuComponent = ({
    className = '',
    children,
    componentRef,
    timeSliderMode,
    place = 'right'
}) => (
    <ul
        className={classNames(
            styles.menu,
            className,
            {
                [styles.left]: place === 'left',
                [styles.right]: place === 'right'
            },
            {
                [styles.debugMode]: timeSliderMode === TimeSliderMode.DEBUG
            }
        )}
        ref={componentRef}
    >
        {children}
    </ul>
);

MenuComponent.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    componentRef: PropTypes.func,
    timeSliderMode: PropTypes.oneOf(TimeSliderStates),
    place: PropTypes.oneOf(['left', 'right'])
};

const mapStateToProps = state => ({
    timeSliderMode: state.scratchGui.timeSlider.timeSliderMode
});

const Submenu = ({children, className, place, ...props}) => (
    <div
        className={classNames(
            styles.submenu,
            className,
            {
                [styles.left]: place === 'left',
                [styles.right]: place === 'right'
            }
        )}
    >
        <MenuComponent
            place={place}
            {...props}
        >
            {children}
        </MenuComponent>
    </div>
);

Submenu.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    place: PropTypes.oneOf(['left', 'right'])
};

const MenuItem = ({
    children,
    className,
    expanded = false,
    onClick
}) => (
    <li
        className={classNames(
            styles.menuItem,
            styles.hoverable,
            className,
            {[styles.expanded]: expanded}
        )}
        onClick={onClick}
    >
        {children}
    </li>
);

MenuItem.propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
    expanded: PropTypes.bool,
    onClick: PropTypes.func
};

const addDividerClassToFirstChild = (child, id) => (
    child && React.cloneElement(child, {
        className: classNames(
            child.className,
            {[styles.menuSection]: id === 0}
        ),
        key: id
    })
);

const MenuSection = ({children}) => (
    <React.Fragment>{
        React.Children.map(children, addDividerClassToFirstChild)
    }</React.Fragment>
);

MenuSection.propTypes = {
    children: PropTypes.node
};

export default connect(
    mapStateToProps
)(MenuComponent);

export {
    MenuItem,
    MenuSection,
    Submenu
};
