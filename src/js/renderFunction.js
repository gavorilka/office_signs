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
    #daysOfWeek = [
        { shortName: "Пн", name: "Понедельник", key: 1 },
        { shortName: "Вт", name: "Вторник", key: 2 },
        { shortName: "Ср", name: "Среда", key: 3 },
        { shortName: "Чт", name: "Четверг", key: 4 },
        { shortName: "Пт", name: "Пятница", key: 5 },
        { shortName: "Сб", name: "Суббота", key: 6 },
        { shortName: "Вс", name: "Воскресенье", key: 0 }
    ]
    #alternativeMessage;
    constructor() {
        this.#url = new URL(window.location)
        this.#building = this.#chooseBuilding()
        this.#room = this.#building ? this.#url.searchParams.get(this.#building): undefined
        this.#alternativeMessage = import.meta.env.VITE_ALTERNATIVE_MESSAGE || null
        if(this.#building && this.#alternativeMessage && this.#checkAlternativeDate() && this.#checkAlternativeCabinet()) {
            //console.log(import.meta.env.VITE_ALTERNATIVE_MESSAGE)
            //console.log(this.#checkAlternativeDate())
            this.renderAlternativeView()
        } else if(this.#building){
            //this.renderAfterAlternativeView()
            this.#currentDate = new Date()
            this.#currentNumberDay = this.#currentDate.getDay()
            this.#currentTime = new Date().toLocaleTimeString('en-RU', {timeZone: 'Europe/Moscow', hour12: false})
            this.#serverQuery().then(()=> {
                this.renderDate()
                this.renderCabinet()
                this.renderRadioGroup()
            }).catch(()=>{
                this.renderEmptyBody()
            })
        } else {
            this.renderEmptyUrlParam()
        }
    }

    #chooseBuilding (){
        return this.#url.searchParams.get('high') ?'high' : this.#url.searchParams.get('primary') ? 'primary' : this.#url.searchParams.get('lab') ? 'lab' : undefined
    }

    async #serverQuery(){
        try{
            const response = await fetch(`${import.meta.env.VITE_API_SERVER}/?building=${this.#building}&room=${this.#room}`)
            const data = await response.json()
            const result = data.response
            if(result.state === 200) {
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

    #checkAlternativeDate() {
        if(import.meta.env.VITE_ALTERNATIVE_DATE_LIST) {
            try {
                const datesArray = JSON.parse(import.meta.env.VITE_ALTERNATIVE_DATE_LIST)
                const currentDate = new Date()
                currentDate.setHours(0, 0, 0, 0)
                const normalizedDates = datesArray.map(date => {
                    const normalizedDate = new Date(date);
                    // Проверяем, является ли дата корректной
                    if (isNaN(normalizedDate.getTime())) {
                        console.warn(`Некорректная дата: ${date}`)
                        return null; // Возвращаем null для некорректных дат
                    }
                    normalizedDate.setHours(0, 0, 0, 0); // Обнуляем время
                    return normalizedDate;
                }).filter(date => date !== null) // Убираем некорректные даты
                //console.log('нормализованные даты: ', normalizedDates)

                return normalizedDates.some(date => date.getTime() === currentDate.getTime());
            } catch (error) {
             return false
            }
        } else {
            return false
        }
    }

    #checkAlternativeCabinet() {
        if(import.meta.env.VITE_ALTERNATIVE_CABINET_LIST) {
            try{
                const cabinetArray = JSON.parse(import.meta.env.VITE_ALTERNATIVE_CABINET_LIST)
                const currentCabinet = { building: this.#building, room: +this.#room };
                const isCabinetIncluded = cabinetArray.some(cabinet =>
                    cabinet.building === currentCabinet.building && cabinet.room === currentCabinet.room
                )
                if(cabinetArray.length > 0 && isCabinetIncluded) {
                    console.log(`in list`)
                    return true
                } else {
                    console.log(`no list`)
                    return false
                }
            } catch (e) {
                return false
            }
        } else {
            return true
        }
    }

    convertTimeToHHMM(time) {
        if(time){
            const [hours, minutes] = time.split(':')
            return `${hours}:${minutes}`
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
        if(!this.#data){
            console.log('нет даты')
            return this.renderEmptyDataBody()
        }
        if(this.#data.days[this.#radioCheckedDate]){
            const items = Object.entries(this.#data.days[this.#radioCheckedDate].items)
            if(items.length === 0){
                //Если массив уроков пуст
                this.renderEmptyBody()
            } else {
                for (let i = 0; i < items.length; i++) {
                    const [index, item] = items[i]
                    const button = document.createElement('button')
                    button.setAttribute('type', 'button')
                    button.classList.add('list-group-item', 'list-group-item-action','choose-time-item')

                    const ringStart = item.ring_start
                    const ringEnd = item.ring_end
                    const ringNextStart = (i < items.length - 1) ? items[i + 1][1].ring_start : null
                    const ringPrevEnd = (i !== 0)? items[i -1][1].ring_end : null

                    button.setAttribute('data-start', ringStart)
                    button.setAttribute('data-end', ringEnd)
                    button.setAttribute('data-index', index)

                    const start = new Date(`${this.#radioCheckedDate}T${ringStart}`)
                    const end = new Date(`${this.#radioCheckedDate}T${ringEnd}`)
                    const nextStart = (ringNextStart) && new Date(`${this.#radioCheckedDate}T${ringNextStart}`)
                    const current = new Date(`${this.#radioCheckedDate}T${this.#currentTime}`)
                    const prevEnd = (ringPrevEnd) && new Date(`${this.#radioCheckedDate}T${ringPrevEnd}`)


                    button.textContent = `${this.convertTimeToHHMM(ringStart)} - ${this.convertTimeToHHMM(ringEnd)}`
                    //console.log(ringPrevEnd, prevEnd)
                    if (current < start && ringPrevEnd === null) {
                        //Если уроки не начались
                        //console.log('уроки не начались')
                        this.renderBreakBody(0)
                    } else if (current >= start && current <= end) {
                        button.classList.add('active')
                        button.setAttribute("aria-current","true")
                        this.renderBody(Number(index))
                    } else if (current >= end && current <= nextStart) {
                        //Если перемена
                        this.renderBreakBody(Number(index) + 1)
                    } else if (nextStart === null && current >= end) {
                        // Если уроки кончены
                        this.renderEndLessonBody()
                    } else if(nextStart === '' && current >= prevEnd) {
                            //Если уроки без метки времени в журнале после урока со временем
                            this.renderBreakBody(Number(index))
                            this.renderNoTime()
                    } else if(ringStart === '' && ringEnd === '' && !ringNextStart && !ringPrevEnd) {
                        // Нет времени текущего у предыдущего и последующего
                        // console.log('Нет времени текущего у предыдущего и последующего')
                        this.renderNoLessonsTime()
                    }

                    button.addEventListener("click", this.clickTimeHandler.bind(this))
                    timeGroup.append(button)
                }
            }
        } else {
            //TODO: если понадобиться сделать подгруздку по дням или подтянуть следующую неделю
            this.renderEmptyDataBody()
        }
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

    renderNoTime(){
        const next = document.querySelector('.next-lesson')
        const cardText = document.createElement('div')
        cardText.classList.add('text-center')

        const h3 = document.createElement('h3')
        h3.textContent = `Будьте внимательны!`
        cardText.appendChild(h3)

        const p1 = document.createElement('p')
        p1.textContent = `Время текущего или следующего урока не доступно`
        cardText.appendChild(p1)

        const p2 = document.createElement('p')
        p2.textContent = `Следующий урок доступен только в ручном режиме`
        cardText.appendChild(p2)

        next.append(cardText)

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

    renderBreakBody(index) {
        const lessonsCard = document.querySelector('.lessons-card')
        lessonsCard.innerHTML = ''
        if(this.#data.days[this.#radioCheckedDate].items[index]){
            lessonsCard.appendChild(this.renderNextLesson(this.#data.days[this.#radioCheckedDate].items[index]))
        }
    }

    renderEmptyBody() {
        const lessonsCard = document.querySelector('.lessons-card')
        lessonsCard.innerHTML = ''

        const card = document.createElement('div')
        card.classList.add('card-header')


        const cardText = document.createElement('div')
        cardText.classList.add('card-text', 'text-center')
        card.appendChild(cardText)

        const lessonTitle = document.createElement('h3')
        lessonTitle.classList.add('lesson')
        cardText.appendChild(lessonTitle)

        lessonTitle.textContent = `Уроки по журналу не обнаружены`

        lessonsCard.appendChild(card)
    }

    renderNoLessonsTime() {
        const lessonsCard = document.querySelector('.lessons-card')
        lessonsCard.innerHTML = ''

        const card = document.createElement('div')
        card.classList.add('card-header')


        const cardText = document.createElement('div')
        cardText.classList.add('card-text', 'text-center')
        card.appendChild(cardText)

        const lessonTitle = document.createElement('h3')
        lessonTitle.classList.add('lesson')
        cardText.appendChild(lessonTitle)

        lessonTitle.textContent = `Не обнаружены или не определены временные метки для предыдущего, текущего и последующего уроков в журнале. Пожалуйста, обновите журнал или выполните действие переключения урока вручную!`

        lessonsCard.appendChild(card)
    }

    renderEndLessonBody() {
        const lessonsCard = document.querySelector('.lessons-card')
        lessonsCard.innerHTML = ''

        const card = document.createElement('div')
        card.classList.add('card-header')

        const cardText = document.createElement('div')
        cardText.classList.add('card-text', 'text-center')
        card.appendChild(cardText)

        const lessonTitle = document.createElement('h3')
        cardText.appendChild(lessonTitle)

        lessonTitle.textContent = `Уроки окончены или не определён временной промежуток`

        lessonsCard.appendChild(card)
    }

    renderEmptyDataBody() {
        const lessonsCard = document.querySelector('.lessons-card')
        lessonsCard.innerHTML = ''

        const card = document.createElement('div')
        card.classList.add('card-header')


        const cardText = document.createElement('div')
        cardText.classList.add('card-text', 'text-center')
        card.appendChild(cardText)

        const lessonTitle = document.createElement('h3')
        lessonTitle.classList.add('lesson')
        cardText.appendChild(lessonTitle)

        lessonTitle.textContent = `О! Ужас!!! Данные не обновляются по кабинету или их НЕТ! Если ничего не сломалось, то сегодня воскресенье! Лицей по воскресеньям не работает. Просьба не выводить табличку из спящего режима! Она отдыхает!`

        lessonsCard.appendChild(card)
    }

    renderEmptyUrlParam() {
        const lessonsCard = document.querySelector('.lessons-card')
        lessonsCard.innerHTML = ''

        const chooseDate = document.querySelector('.choose-date')
        const cabinet = document.querySelector('.cabinet')

        const card = document.createElement('div')
        card.classList.add('card-header')
        lessonsCard.appendChild(card)


        const cardText = document.createElement('div')
        cardText.classList.add('card-text', 'text-center')
        card.appendChild(cardText)

        const lessonTitle = document.createElement('h3')
        lessonTitle.classList.add('lesson')
        cardText.appendChild(lessonTitle)

        const p1 = document.createElement('p')
        p1.classList.add('lesson')
        cardText.appendChild(p1)

        const p2 = document.createElement('p')
        cardText.appendChild(p2)

        const p3 = document.createElement('p')
        cardText.appendChild(p3)

        lessonTitle.textContent = `Укажите верно гет параметры`
        p1.textContent =`high={cabinetNumber} - Старшая школа`
        p2.textContent =`lab={cabinetNumber} - Лабораторный корпус`
        p3.textContent =`primary={cabinetNumber} - Начальная школа`
        chooseDate.textContent = `недоступно`
        cabinet.textContent =`Кабинет не найден`
    }

    renderAlternativeView() {
        const mainBlock = document.querySelector('main')
        mainBlock.classList.add('alternative-main')
        //console.log(mainBlock)
        mainBlock.innerHTML = `
          <h1 class="mt-2 card-title cabinet text-center">Кабинет №${this.#room}</h1>
          <div class="row mt-5 align-items-center">
              <div class="col-4">
                  <img src="/Crop_logoRedLion.svg" class="img-fluid" alt="Лицей №369">
              </div>
              <div class="col-8 text-center">
                  <h2>${this.#alternativeMessage}</h2>
              </div>
          </div>
        `
    }

    renderAfterAlternativeView() {
        const mainBlock = document.querySelector('main')
        if (mainBlock.classList.contains('alternative-main')) {
            mainBlock.classList.remove('alternative-main')
            mainBlock.innerHTML = `
                <div class='col-sm-4'>
                    <h5 class="text-center">
                        Расписание уроков
                    </h5>
                    <h5 class="text-center mb-4 choose-date">
                    </h5>
                    <div class="btn-group mb-4 choose-day" role="group" aria-label="Выбор дня">
                    </div>
                    <div class="choose-time list-group">
                    </div>
                </div>
                <div class='col-sm-8'>
                    <div class="card container-fluid mb-2">
                        <div class="card-body d-flex align-items-center">
                            <h1 class="cabinet"></h1>
                            <div class="ms-auto logo-block">
                                <img src="/logoBlue.svg" class="img-fluid" alt="Лицей 369">
                            </div>
                        </div>
                    </div>
                    <div class="card lessons-card">
                    </div>
                </div>
            `
        }
    }
}

new RenderFunction()


