"use strict";

const weekDay = ['Пн','Вт','Ср','Чт','Пт','Cб','Вс']
const url = new URL(window.location)
const urlCabinet = url.searchParams.get('cabinet')
document.querySelector('.cabinet').append(`Кабинет ${urlCabinet}`)
const time = () => {
    const timeBlock = document.querySelector('.time')
    const date = new Date()
    timeBlock.textContent =`Урок №4 ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
}
setInterval(time, 1000, );