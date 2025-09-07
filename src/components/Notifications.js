// src/components/Notifications.js
import React from 'react';
import { FiShoppingBag } from 'react-icons/fi';
import { FaCircle } from 'react-icons/fa';

const Notifications = ({ notifications, setNotifications, colors }) => {
  return (
    <>
      <button 
        className="notification-button"
        onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
        aria-label="View notifications"
      >
        <FiShoppingBag size={18} />
        {notifications.filter(n => !n.read).length > 0 && (
          <span className="notification-badge">
            {notifications.filter(n => !n.read).length}
          </span>
        )}
      </button>

      {notifications.filter(n => !n.read).length > 0 && (
        <div className="notification-dropdown no-print">
          <div className="notification-header">
            <h3>Notifications</h3>
            <button 
              className="mark-all-read"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              aria-label="Mark all notifications as read"
            >
              Mark all as read
            </button>
          </div>
          <div className="notification-list">
            {notifications.slice(0, 3).map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
              >
                <div className="notification-icon">
                  <FaCircle size={8} />
                </div>
                <div className="notification-content">
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{notification.time}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="notification-footer">
            <a href="/" onClick={(e) => e.preventDefault()} aria-label="View all notifications">View all notifications</a>
          </div>
        </div>
      )}
    </>
  );
};

export default Notifications;
