// src/components/ui/Card.jsx
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const Card = ({ children, className }) => {
  return (
    <div
      className={classNames(
        'relative bg-white shadow-lg rounded-xl p-6 border border-gray-200',
        'transition-transform transform  hover:shadow-lg',
        'before:absolute before:inset-0 before:rounded-xl ',
        'before:blur-xl before:z-[-1]',
        className
      )}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

Card.defaultProps = {
  className: '',
};
