import DateDisplay from './date-display.js';
import MonthDisplay from './month-display.js';
import YearDisplay from './year-display.js';
import DecadeDisplay from "./decade-display.js";
import TimeDisplay from "./time-display.js";
import DateTime from "../datetime.js";
import {DatePickerModes, Namespace} from "../conts.js";


export default class Display {
    constructor(context) {
        this.context = context;
        this._dateDisplay = new DateDisplay(context);
        this._monthDisplay = new MonthDisplay(context);
        this._yearDisplay = new YearDisplay(context);
        this._decadeDisplay = new DecadeDisplay(context);
        this._timeDisplay = new TimeDisplay(context);

        this._widget = undefined;
    }

    get widget() {
        return this._widget;
    }

    update() {
        if (!this._widget) return;
        this.updateDateView();
        this.updateTimeView();
    }

    updateDateView() {
        if (this._hasDate())
            this._dateDisplay.update();
    }

    updateTimeView() {
        if (this._hasTime())
            this._timeDisplay.update();
    }

    show() {
        if (this.context._options.useCurrent) {
            //todo in the td4 branch a pr changed this to allow granularity
            this.context.dates._setValue(new DateTime());
        }
        this._buildWidget();
        this._showMode();
        window.addEventListener('resize', () => this._place());
        this._place();
        //todo unhide widget
        this.context._notifyEvent({
            type: Namespace.EVENT_SHOW
        })
    }

    _showMode(dir) {
        if (!this.widget) {
            return;
        }
        if (dir) {
            this.context.currentViewMode = Math.max(this.context.minViewModeNumber, Math.min(3, this.context.currentViewMode + dir));
        }
        this.widget.querySelectorAll('.datepicker > div, .timepicker > div').forEach(e => e.style.display = 'none');

        const datePickerMode = DatePickerModes[this.context.currentViewMode];
        let picker = this.widget.querySelector(`.datepicker-${datePickerMode.CLASS_NAME}`);
        if (picker == null) {
            const dateContainer = this.widget.querySelector('.datepicker');
            switch (datePickerMode.CLASS_NAME) {
                case 'years':
                    break;
                case 'months':
                    dateContainer.appendChild(this._monthDisplay.picker);
                    this._monthDisplay.update();
                    break;
                case 'days':
                    dateContainer.appendChild(this._dateDisplay.picker);
                    this._dateDisplay.update();
                    break;
            }
            picker = this.widget.querySelector(`.datepicker-${datePickerMode.CLASS_NAME}`);
        }

        picker.style.display = 'block';
    }

    _place() {
        console.log('place called');
    }

    _buildWidget() {
        const template = document.createElement('div');
        //todo bootstrap, need to namespace classes
        template.classList.add('bootstrap-datetimepicker-widget');
        if (this.context._options.calendarWeeks)
            template.classList.add('tempusdominus-bootstrap-datetimepicker-widget-with-calendar-weeks');  //todo namespace

        const dateView = document.createElement('div');
        dateView.classList.add('datepicker');//todo I think I want to rename these to datepicker-container or something
        //dateView.appendChild(this._dateDisplay.picker); //todo remove both of these appends. I'd rather only build then when needed

        const timeView = document.createElement('div');
        timeView.classList.add('timepicker');
        timeView.appendChild(this._timeDisplay.picker);

        const toolbar = document.createElement('li');
        toolbar.classList.add('picker-switch');
        if (this.context._options.collapse) toolbar.classList.add('accordion-toggle'); //todo bootstrap
        toolbar.appendChild(this._toolbar);

        /*if (!this.context._options.inline) { //todo restore this. for now I don't want the position stuff it adds
            template.classList.add('dropdown-menu'); //todo bootstrap
        }*/

        if (this.context._options.display.components.useTwentyfourHour) {
            template.classList.add('useTwentyfour');  //todo namespace
        }

        if (this.context._options.display.components.second && !this.context._options.display.components.useTwentyfourHour) {
            template.classList.add('wider'); //todo namespace?
        }

        if (this.context._options.sideBySide && this._hasDate() && this._hasTime()) {
            template.classList.add('timepicker-sbs'); //todo namespace?
            if (this.context._options.toolbarPlacement === 'top') {
                template.appendChild(toolbar);
            }
            const row = document.createElement('div');
            row.classList.add('row'); //todo bootstrap
            dateView.classList.add('col-md-6');
            timeView.classList.add('col-md-6');

            row.appendChild(dateView);
            row.appendChild(timeView);

            if (this.context._options.toolbarPlacement === 'bottom' || this.context._options.toolbarPlacement === 'default') {
                template.appendChild(toolbar);
            }
            this._widget = template;
            return;
        }

        const content = document.createElement('ul');
        content.classList.add('list-unstyled'); //todo bootstrap

        if (this.context._options.toolbarPlacement === 'top') {
            content.appendChild(toolbar);
        }
        if (this._hasDate()) {
            const li = document.createElement('li');
            if (this.context._options.collapse && this._hasTime()) {
                //li.classList.add('collapse'); //todo bootstrap
                if (this.context._options.viewMode !== 'times') li.classList.add('show');
            }
            li.appendChild(dateView);
            content.appendChild(li);
        }
        if (this.context._options.toolbarPlacement === 'default') {
            content.appendChild(toolbar);
        }
        if (this._hasTime()) {
            const li = document.createElement('li');
            if (this.context._options.collapse && this._hasDate()) {
                //li.classList.add('collapse'); //todo bootstrap
                if (this.context._options.viewMode === 'times') li.classList.add('show');
            }
            li.appendChild(timeView);
            content.appendChild(li);
        }
        if (this.context._options.toolbarPlacement === 'bottom') {
            content.appendChild(toolbar);
        }

        template.appendChild(content);

        this._widget = template;
    }

    _hasTime() {
        return this.context._options.display.components.hours || this.context._options.display.components.minutes || this.context._options.display.components.seconds;
    }

    _hasDate() {
        return this.context._options.display.components.year || this.context._options.display.components.month || this.context._options.display.components.date;
    }

    get _toolbar() {
        const tbody = document.createElement('tbody');

        if (this.context._options.display.buttons.showToday) {
            const td = document.createElement('td');
            const a = document.createElement('a');
            a.setAttribute('href', 'javascript:void(0);');
            a.setAttribute('tabindex', '-1');
            a.setAttribute('data-action', 'today');
            a.setAttribute('title', this.context._options.localization.today);

            a.appendChild(this.iconTag(this.context._options.display.icons.today));
            td.appendChild(a);
            tbody.appendChild(td);
        }
        if (!this.context._options.sideBySide && this.context._options.collapse && this._hasDate() && this._hasTime()) {
            let title, icon;
            if (this.context._options.viewMode === 'times') {
                title = this.context._options.localization.selectDate;
                icon = this.context._options.display.icons.date;
            } else {
                title = this.context._options.localization.selectTime;
                icon = this.context._options.display.icons.time;
            }

            const td = document.createElement('td');
            const a = document.createElement('a');
            a.setAttribute('href', 'javascript:void(0);');
            a.setAttribute('tabindex', '-1');
            a.setAttribute('data-action', 'togglePicker');
            a.setAttribute('title', title);

            a.appendChild(this.iconTag(icon));
            td.appendChild(a);
            tbody.appendChild(td);
        }
        if (this.context._options.display.buttons.showClear) {
            const td = document.createElement('td');
            const a = document.createElement('a');
            a.setAttribute('href', 'javascript:void(0);');
            a.setAttribute('tabindex', '-1');
            a.setAttribute('data-action', 'clear');
            a.setAttribute('title', this.context._options.localization.clear);

            a.appendChild(this.iconTag(this.context._options.display.icons.today));
            td.appendChild(a);
            tbody.appendChild(td);
        }
        if (this.context._options.display.buttons.showClose) {
            const td = document.createElement('td');
            const a = document.createElement('a');
            a.setAttribute('href', 'javascript:void(0);');
            a.setAttribute('tabindex', '-1');
            a.setAttribute('data-action', 'close');
            a.setAttribute('title', this.context._options.localization.close);

            a.appendChild(this.iconTag(this.context._options.display.icons.today));
            td.appendChild(a);
            tbody.appendChild(td);
        }
        const table = document.createElement('table');
        table.appendChild(tbody);

        return table;
    }

    /***
     *
     * @returns {Node}
     */
    get headTemplate() {
        const headTemplate = document.createElement('thead');
        const previous = document.createElement('th');
        previous.classList.add('prev');
        previous.setAttribute('data-action', 'previous');
        previous.appendChild(this.iconTag(this.context._options.display.icons.previous));
        headTemplate.appendChild(previous);

        const switcher = document.createElement('th');
        switcher.classList.add('picker-switch');
        switcher.setAttribute('data-action', 'pickerSwitch');
        switcher.setAttribute('colspan', this.context._options.calendarWeeks ? '6' : '5');
        headTemplate.appendChild(switcher);

        const next = document.createElement('th');
        next.classList.add('next');
        next.setAttribute('data-action', 'next');
        next.appendChild(this.iconTag(this.context._options.display.icons.next));
        headTemplate.appendChild(next);
        return headTemplate.cloneNode(true);
    }

    get contentTemplate() {
        const contentTemplate = document.createElement('tbody');
        const rowElement = document.createElement('tr');
        const td = document.createElement('td');
        td.setAttribute('colspan', this.context._options.calendarWeeks ? '6' : '5');
        rowElement.appendChild(td);
        contentTemplate.appendChild(rowElement);
        return contentTemplate.cloneNode(true);
    }

    iconTag(i) {
        const container = document.createElement('span')
        if (this.context._options.display.icons.type === 'sprites') {
            const svg = document.createElement('svg');
            svg.innerHTML = `<use xlink:href="${i}"></use>`
            container.appendChild(svg);
            return container;
        }
        const icon = document.createElement('i');
        DOMTokenList.prototype.add.apply(icon.classList, i.split(' '));
        container.appendChild(icon);
        return container;
    }
}