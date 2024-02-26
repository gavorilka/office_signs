"use strict"

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
            const response = await fetch(`${import.meta.env.VITE_API_SERVER}/?building=${this.#building}&room=${this.#room}`)
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
        const currentDate = new Date(this.#currentDate) // Создаем копию текущей даты
        const currentDay = currentDate.getDay()
        const delta = currentDay - dayIndex
        currentDate.setDate(currentDate.getDate() - delta)

        const year = currentDate.getFullYear()
        let month = currentDate.getMonth() + 1
        if (month < 10) {
            month = '0' + month
        }
        let day = currentDate.getDate()
        if (day < 10) {
            day = '0' + day
        }

        return `${year}-${month}-${day}`
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

    convertMonthToName (index) {
        const monthName = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
        return monthName[index]
    }

    radioHandler(event){
        const radio = event.target
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

        document.querySelector('.choose-date').textContent = `${this.#currentDate.getDate()} ${this.convertMonthToName(this.#currentDate.getMonth())} ${this.#currentDate.getFullYear()} `
    }

    renderRadioGroup() {
        const radioGroup = document.querySelector('.choose-day')
        this.#daysOfWeek.forEach((day,i)=>{
            const dayDate = this.#getCurrentWeekDate(i + 1)

            const radioInput = document.createElement('input')
            radioInput.setAttribute('type', 'radio')
            radioInput.classList.add('btn-check')
            radioInput.setAttribute('name', 'day')
            radioInput.setAttribute('data-day', dayDate)
            radioInput.setAttribute('data-key', day.key)
            radioInput.setAttribute('title', day.name)
            radioInput.setAttribute('id', `day${day.key}`)
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
        const timeGroup = document.querySelector('.choose-time')
        timeGroup.innerHTML = ''
        this.#data.days[this.#radioCheckedDate].items.forEach((item, index)=> {
            const button = document.createElement('button')
            button.setAttribute('type', 'button')
            button.classList.add('list-group-item', 'list-group-item-action','choose-time-item')
            const ringStart = item.ring_start
            const ringEnd = item.ring_end
            button.setAttribute('data-start', ringStart)
            button.setAttribute('data-end', ringEnd)
            button.setAttribute('data-index', index)
            const start = new Date(`${this.#radioCheckedDate}T${ringStart}`)
            const end = new Date(`${this.#radioCheckedDate}T${ringEnd}`)
            const current = new Date(`${this.#radioCheckedDate}T${this.#currentTime}`)

            button.textContent = `${this.convertTimeToHHMM(ringStart)} - ${this.convertTimeToHHMM(ringEnd)}`

            if (current >= start && current <= end) {
                button.classList.add('active')
                button.setAttribute("aria-current","true")
                this.renderBody(Number(index))
            }
            button.addEventListener("click", this.clickTimeHandler.bind(this))
            timeGroup.append(button)
        })
    }
    // Функция для рендеринга разметки текущего урока
    renderCurrentLesson(currentLessonData) {

        const cardHeader = document.createElement('div')
        cardHeader.classList.add('card-header', 'current-lesson')

        const cardTitle = document.createElement('h2')
        cardTitle.classList.add('card-title', 'mb-4')
        cardHeader.appendChild(cardTitle)

        const cardText = document.createElement('div')
        cardText.classList.add('card-text')

        const lessonTitle = document.createElement('h3')
        lessonTitle.classList.add('lesson')
        cardText.appendChild(lessonTitle)

        const teacherName = document.createElement('h4')
        teacherName.classList.add('teacher')
        cardText.appendChild(teacherName)

        const lessonClass = document.createElement('p')
        lessonClass.classList.add('class')
        cardText.appendChild(lessonClass)

        cardHeader.appendChild(cardText)

        // Добавление данных урока в соответствующие элементы
        cardTitle.textContent = `Урок №${currentLessonData.num} (${this.convertTimeToHHMM(currentLessonData.ring_start)}-${this.convertTimeToHHMM(currentLessonData.ring_end)})`
        lessonTitle.textContent = `${currentLessonData.lesson}`
        teacherName.textContent = `Учитель: ${currentLessonData.teacher}`
        lessonClass.textContent = `Класс на уроке: ${currentLessonData.class}`

        return cardHeader
    }

    renderNextLesson(nextLessonData) {
        const nextLessonCard = document.createElement('div')
        nextLessonCard.classList.add('card-body', 'fw-semibold', 'flex-column', 'd-flex', 'align-items-end', 'next-lesson')

        const cardTitle = document.createElement('h4')
        cardTitle.classList.add('card-title', 'mb-5', 'align-self-center')
        nextLessonCard.appendChild(cardTitle)

        const cardText = document.createElement('div')
        cardText.classList.add('card-text')

        const nextLessonTitle = document.createElement('p')
        nextLessonTitle.classList.add('lesson')
        cardText.appendChild(nextLessonTitle)

        const nextTeacherName = document.createElement('p')
        nextTeacherName.classList.add('teacher')
        cardText.appendChild(nextTeacherName)

        const nextLessonClass = document.createElement('p')
        nextLessonClass.classList.add('class')
        cardText.appendChild(nextLessonClass)

        nextLessonCard.appendChild(cardText)

        // Добавление данных следующего урока в соответствующие элементы
        cardTitle.textContent = ` Следующий урок №${nextLessonData.num} (${this.convertTimeToHHMM(nextLessonData.ring_start)}-${this.convertTimeToHHMM(nextLessonData.ring_end)})`
        nextLessonTitle.textContent = `${nextLessonData.lesson}`
        nextTeacherName.textContent = `Учитель: ${nextLessonData.teacher}`
        nextLessonClass.textContent = `${nextLessonData.class} класс`

        return nextLessonCard
    }
    renderBody(index){
        const lessonsCard = document.querySelector('.lessons-card')
        lessonsCard.innerHTML = ''
        if(this.#data.days[this.#radioCheckedDate].items[index]){
            lessonsCard.append(this.renderCurrentLesson(this.#data.days[this.#radioCheckedDate].items[index]))
        }
        if(this.#data.days[this.#radioCheckedDate].items[index + 1]){
            lessonsCard.appendChild(this.renderNextLesson(this.#data.days[this.#radioCheckedDate].items[index + 1]))
        }
    }

}
const renderFunction = new RenderFunction()


