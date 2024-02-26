"use strict";

class RenderFunction {
    #url
    #building
    #room
    #currentDate
    #currentNumberDay
    #currentTime
    #data
    #radioCheckedDate
    #chooseTime
    #daysOfWeek = [
        { shortName: "Пн", name: "Понедельник", key: 1 },
        { shortName: "Вт", name: "Вторник", key: 2 },
        { shortName: "Ср", name: "Среда", key: 3 },
        { shortName: "Чт", name: "Четверг", key: 4 },
        { shortName: "Пт", name: "Пятница", key: 5 },
        { shortName: "Сб", name: "Суббота", key: 6 },
        { shortName: "Вс", name: "Воскресенье", key: 0 }
    ]
    #localRings = [
        { ring_start: "08:00:00", ring_end: "08:40:00" },
        { ring_start: "08:45:00", ring_end: "09:25:00" },
        { ring_start: "09:45:00", ring_end: "10:25:00" },
        { ring_start: "10:30:00", ring_end: "11:10:00" },
        { ring_start: "11:30:00", ring_end: "11:10:00" },
        { ring_start: "12:15:00", ring_end: "12:55:00" },
        { ring_start: "13:15:00", ring_end: "13:55:00" },
        { ring_start: "14:00:00", ring_end: "14:40:00" },
        { ring_start: "15:00:00", ring_end: "15:40:00" },
        { ring_start: "15:50:00", ring_end: "16:30:00" },
        { ring_start: "16:40:00", ring_end: "17:20:00" },
        { ring_start: "17:30:00", ring_end: "18:10:00" },
        { ring_start: "18:20:00", ring_end: "19:00:00" },
        { ring_start: "19:10:00", ring_end: "19:50:00" },
    ]
     constructor() {
        this.#url = new URL(window.location)
        this.#currentDate = new Date()
        this.#currentNumberDay = this.#currentDate.getDay()
        this.#currentTime = new Date().toLocaleTimeString('en-RU', {timeZone: 'Europe/Moscow', hour12: false})
        this.#building = this.#chooseBuilding()
        this.#room = this.#building ? this.#url.searchParams.get(this.#building): undefined
        this.#serverQuery().then(()=> {
            this.renderDate()
            this.renderCabinet()
            this.renderRadioGroup()
        })
    }
    #chooseBuilding (){
        return this.#url.searchParams.get('high') ?'high' : this.#url.searchParams.get('primary') ? 'primary' : this.#url.searchParams.get('lab') ? 'lab' : undefined
    }
    async #serverQuery(){
        try{
            const response = await fetch(`${import.meta.env.VITE_API_SERVER}?building=${this.#building}&room=${this.#room}`)
            const data = await response.json()
            const result = data.response
            if(result.state == 200) {
                this.#data = result.result
                return this.#data
            }
            this.#data = null
            return this.#data
        } catch (e) {
            this.#data = null
            return this.#data
        }
    }
    #getCurrentWeekDate(dayIndex) {
        const currentDate = new Date(this.#currentDate); // Создаем копию текущей даты
        const currentDay = currentDate.getDay();
        const delta = currentDay - dayIndex;
        currentDate.setDate(currentDate.getDate() - delta);

        const year = currentDate.getFullYear();
        let month = currentDate.getMonth() + 1;
        if (month < 10) {
            month = '0' + month;
        }
        let day = currentDate.getDate();
        if (day < 10) {
            day = '0' + day;
        }

        return `${year}-${month}-${day}`;
    }
    convertTimeToHHMM(time) {
        if(time){
            const [hours, minutes] = time.split(':')
            const formattedTime = `${hours}:${minutes}`
            return formattedTime
        } else {
            return ''
        }

    }

    converMonthToName (index) {
        const monthName = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
        return monthName[index]
    }

    radioHandler(event){
        const radio = event.target
        // console.log(event, radio)
        this.#radioCheckedDate = radio.dataset.day
        this.renderTime()
        this.#currentTime = new Date().toLocaleTimeString('en-RU', {timeZone: 'Europe/Moscow', hour12: false})
        this.#currentDate = new Date(`${this.#radioCheckedDate}T${this.#currentTime}`)
        this.renderDate()
    }

    clickTimeHandler(event){
        const chooseBtn = event.target
        document.querySelectorAll('.choose-time-item').forEach((timeItem) => {
            if (timeItem.classList.contains('active') && timeItem.hasAttribute('aria-current')) {
                timeItem.classList.remove('active')
                timeItem.removeAttribute("aria-current")
            }
        })
        chooseBtn.classList.add('active')
        chooseBtn.setAttribute("aria-current","true")
        this.renderBody(Number(chooseBtn.dataset.index))

    }

    renderDate () {
        document.querySelectorAll('.choose-date').textContent = `${this.converMonthToName(this.#currentDate.getDate())} ${this.this.#currentDate.getDate()} ${this.#currentDate.getFullYear()} `
    }

    renderRadioGroup() {
        const radioGroup = document.querySelector('.choose-day')
        this.#daysOfWeek.forEach((day,i)=>{
            const dayDate = this.#getCurrentWeekDate(i + 1)

            const radioInput = document.createElement('input');
            radioInput.setAttribute('type', 'radio')
            radioInput.classList.add('btn-check')
            radioInput.setAttribute('name', 'day')
            radioInput.setAttribute('data-day', dayDate)
            radioInput.setAttribute('data-key', day.key)
            radioInput.setAttribute('title', day.name)
            radioInput.setAttribute('id', `day${day.key}`);
            radioInput.setAttribute('autocomplete', 'off')
            if (day.key === this.#currentNumberDay) { // По умолчанию выбран текущий день недели
                radioInput.setAttribute('checked', true)
                this.#radioCheckedDate = dayDate
            }
            if (day.key === 0) { // Воскресенье делаем неактивным
                radioInput.setAttribute('disabled', true)
            }
            radioInput.addEventListener("change", this.radioHandler.bind(this))

            const label = document.createElement('label')
            label.classList.add('btn', 'btn-outline-primary')
            label.setAttribute('for', `day${day.key}`)
            label.innerText = day.shortName

            radioGroup.appendChild(radioInput)
            radioGroup.appendChild(label)

        })
        this.renderTime()
    }


    renderCabinet() {
        document.querySelector('.cabinet').append(`Кабинет ${this.#room}`)
    }

    renderTime(){
        console.log(this.#radioCheckedDate, this.#data.days[this.#radioCheckedDate])
        const timeGroup = document.querySelector('.choose-time')
        timeGroup.innerHTML = ''
        this.#data.days[this.#radioCheckedDate].items.forEach((item, index)=> {
            const button = document.createElement('button')
            button.setAttribute('type', 'button')
            button.classList.add('list-group-item', 'list-group-item-action','choose-time-item')
            const ringStart = item.ring_start;
            const ringEnd = item.ring_end;
            button.setAttribute('data-start', ringStart)
            button.setAttribute('data-end', ringEnd)
            button.setAttribute('data-index', index)
            const start = new Date(`${this.#radioCheckedDate}T${ringStart}`)
            const end = new Date(`${this.#radioCheckedDate}T${ringEnd}`)
            const current = new Date(`${this.#radioCheckedDate}T${this.#currentTime}`)

            button.textContent = `${this.convertTimeToHHMM(ringStart)} - ${this.convertTimeToHHMM(ringEnd)}`
            // console.log(current)
            if (current >= start && current <= end) {
                button.classList.add('active')
                button.setAttribute("aria-current","true")
                this.renderBody(Number(index))
            }
            button.addEventListener("click", this.clickTimeHandler.bind(this))
            timeGroup.append(button)
        })
    }
    renderBody(index){
        const currentLesson = this.#data.days[this.#radioCheckedDate].items[index]
        console.log(currentLesson)
        document.querySelector('.current-lesson').textContent = `Урок №${currentLesson.num} (${this.convertTimeToHHMM(currentLesson.ring_start)}-${this.convertTimeToHHMM(currentLesson.ring_end)})`
        document.querySelector('.current-lesson-lesson').textContent = `${currentLesson.lesson}`
        document.querySelector('.current-lesson-teacher').textContent = `Учитель: ${currentLesson.teacher}`
        document.querySelector('.current-lesson-class').textContent = `Класс на уроке: ${currentLesson.class}`
        if(this.#data.days[this.#radioCheckedDate].items[index + 1]){
            const nextLesson = this.#data.days[this.#radioCheckedDate].items[index + 1]
            document.querySelector('.next-lesson').textContent = ` Следующий урок №${nextLesson.num} (${this.convertTimeToHHMM(nextLesson.ring_start)}-${this.convertTimeToHHMM(nextLesson.ring_end)})`
            document.querySelector('.next-lesson-lesson').textContent = `${nextLesson.lesson}`
            document.querySelector('.next-lesson-teacher').textContent = `Учитель: ${nextLesson.teacher}`
            document.querySelector('.next-lesson-class').textContent = `${nextLesson.class} класс`
        }

    }

}
const renderFunction = new RenderFunction()


