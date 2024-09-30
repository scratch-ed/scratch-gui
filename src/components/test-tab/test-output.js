/**
 * @fileOverview A basic debug view for the output of the judge.
 */
class Processor {
    constructor(element) {
        this.stack = [];
        this.element = element;
        this.groupStack = [];
        this.correctStack = [true];
    }

    process(message) {
        /** @type {string} */
        const command = message.command;

        if (command === 'start-judgement') {
            this.start = new Date();
        }

        if (command === 'close-judgement') {
            const title = document.getElementById('out');
            if (title) {
                title.innerHTML = `Output (took ${new Date() - this.start}ms)`;
            }
        }

        if (command.startsWith('start')) {
            this.stack.push(message);
        }

        if (command === 'start-group') {
            this.correctStack.push(true);
            // Start a new group.
            const details = document.createElement('details');
            details.open = message.visibility === 'show';
            const summary = document.createElement('summary');
            summary.innerHTML = `<strong>${message.name}</strong>`;
            details.appendChild(summary);
            this.element.appendChild(details);
            this.groupStack.push(this.element);
            this.element = details;
        }

        if (command === 'close-group') {
            const summary = this.element.querySelector('summary');
            const currentCorrect = this.correctStack.pop();
            summary.innerHTML = (currentCorrect ? '✅' : '❌') + summary.innerHTML;
            if (message.summary && currentCorrect) {
                summary.innerHTML += '<br>';
                summary.innerHTML += message.summary;
            }
            this.element = this.groupStack.pop();
            this.correctStack[this.correctStack.length - 1] &&= currentCorrect;
        }

        if (command === 'start-test') {
            this.currentTest = message;
        }

        if (command === 'close-test') {
            this.element.innerHTML += `<span title='${this.currentTest.name}'>${
                message.status === 'correct' ? '✅' : '❌'
            } ${message.feedback || this.currentTest.name}</span><br>`;
            this.correctStack[this.correctStack.length - 1] &&= message.status === 'correct';
        }

        if (command.startsWith('close')) {
            this.stack.pop();
        } else if (command === 'append-message') {
            this.element.innerHTML += `Message: ${message.message}`;
        } else if (command === 'escalate-status') {
            this.element.innerHTML += `<br><strong>ESCALATION</strong>: status is now ${message.status}`;
        }
    }
}

// eslint-disable-next-line no-unused-vars
export function init(element) {
    const processor = new Processor(element);
    window.handleOut = (result) => {
        processor.process(result);
        console.debug(result);
    };
}
