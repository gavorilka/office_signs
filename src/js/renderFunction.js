"use strict";

const weekDay = ['Пн','Вт','Ср','Чт','Пт','Cб','Вс']
const url = new URL(window.location)
const urlCabinet = url.searchParams.get('cabinet')
document.querySelector('.cabinet').append(`Кабинет ${urlCabinet}`)