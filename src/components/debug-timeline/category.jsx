import React from 'react';
import styles from './debug-timeline.css';
import {EVENT_TYPES, TRACK_HEIGHT} from './constants.ts';
import PropTypes from 'prop-types';
import Icon from './icon.jsx';

const CategoryItem = ({category}) => {
    const colorClass = styles[category.color];

    return (
        <div
            className={styles.categoryItem}
            style={{
                height: `${TRACK_HEIGHT}px`,
                minHeight: `${TRACK_HEIGHT}px`
            }}
        >
            <div className={styles.categoryItemIcon}>
                <Icon
                    category={category}
                    isEvent={false}
                />
            </div>
            <div className={styles.categoryItemText}>
                <span>{category.name}</span>
                {category.id === EVENT_TYPES.BROADCAST &&
                    <div
                        className={styles.categoryItemBroadcast}
                        title={category.options.broadcastName.value}
                    >
                        <span>{category.options.broadcastName.value}</span>
                    </div>
                }
            </div>
            <div
                className={`${styles.categoryItemColor} ${colorClass}`}
            />
        </div>
    );
};

CategoryItem.propTypes = {
    category: PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        // eslint-disable-next-line react/forbid-prop-types
        options: PropTypes.object.isRequired
    }).isRequired
};

const Category = ({categories}) => (
    <div className={styles.categoryList}>
        {categories.map((category, index) => (
            <CategoryItem
                key={index}
                category={category}
            />
        ))}
    </div>
);

Category.propTypes = {
    categories: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired,
        // eslint-disable-next-line react/forbid-prop-types
        options: PropTypes.object.isRequired
    })).isRequired
};

export default Category;
