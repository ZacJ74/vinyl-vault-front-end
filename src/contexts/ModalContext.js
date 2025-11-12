import React, { createContext, useContext, useState } from 'react';

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert',
    onConfirm: null
  });

  const showAlert = (title, message) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: null
    });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, closeModal, modal }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}