export const ID_LENGTH = 10;

export const customStyles = {
    overlay: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)'
    },
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        transform: 'translate(-50%, -50%)',
        border: '1px solid #bbb',
        padding: '20px',
        borderRadius: '0px',
    }
};

export const TASK_CHOICES = {
    TIMER: 'timer',
    STOPWATCH: 'stopwatch',
    REPEAT: 'repeat',
};

export const DEFAULT_MODAL_SELECTED_OPTION = TASK_CHOICES.TIMER;
export const TICKS_PER_SEC = 50;
