import React from 'react';
import styles from './debug-timeline.css';
import {TRACK_HEIGHT} from './constants.ts';
import PropTypes from 'prop-types';

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
                <img
                    alt="Icon of event"
                    className={styles.eventIcon}
                    draggable={false}
                    src={category.icon}
                />
            </div>
            <span>{category.name}</span>
            <div
                className={`${styles.categoryItemColor} ${colorClass}`}
            />
        </div>
    );
};

CategoryItem.propTypes = {
    category: PropTypes.shape({
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired
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
        name: PropTypes.string.isRequired,
        icon: PropTypes.string.isRequired,
        color: PropTypes.string.isRequired
    })).isRequired
};

export default Category;
