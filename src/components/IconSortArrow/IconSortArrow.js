import React from 'react';
import classNames from 'classnames';

import css from './IconSortArrow.module.css';

/**
 * Sort icon
 *
 * @component
 * @param {Object} props
 * @param {string?} props.className add more style rules in addition to components own root class
 * @returns {JSX.Element} SVG icon
 */
const IconSortArrow = props => {
  const classes = classNames(css.icon, props.className);
  // extra small arrow head (down)
  return (
    <svg className={classes} width="8" height="5" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.764 4.236c.131.13.341.13.472 0l2.666-2.667a.333.333 0 10-.471-.471L4 3.528l-2.43-2.43a.333.333 0 10-.471.471l2.665 2.667z"
        fill="#4A4A4A"
        stroke="#4A4A4A"
        fillRule="evenodd"
      />
    </svg>
  );
};

export default IconSortArrow;
