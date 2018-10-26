'use strict';

ELEMENT.locale(ELEMENT.lang.en);


const APIKEY = 'keyKfVuiM6CHUTRrF';
var Airtable = require('airtable');
var base  = new Airtable({
  apiKey:APIKEY
}).base(
  'app9niT1xRtBj9X0c'
)

var hang_muc = []
get_hang_muc()

function createProject(that) {
    let projectObj = that.project;
    base('Dự án').create({
        "Tên Dự án": projectObj.name,
        "Địa chỉ": projectObj.address,
        "số điện thoại": projectObj.phone,
        "quotation": [
        ]
      }, function(err, record) {
          if (err) { console.error(err); return; }
          if (typeof record !== 'undefined') {
            //   console.log('record is not undefined')
              let projectId= record.getId();
            //   console.log(projectId)
              let objToSubmit = makeObjToSubmit(that.data, projectId)
              objToSubmit.forEach( element => {
                createQuotation(element,that)
              })
              that.loading.close();
              that.$notify({
                title: 'Success',
                message: 'Bạn đã khởi tạo báo giá thành công',
                type: 'success'
              });
          } else{
            that.$notify.error({
                title: 'Error',
                message: `Tạo Dự Án Không Thành Công, Vui lòng kiểm tra lại thông tin`
              });
          }
      });
}

function makeObjToSubmit(obj,projectId) {
// it is prepare obj to submit form
    let objs= Object.assign([]);
    obj.forEach(element => {
        let _ = {   subjectId: element.subjectId, 
                    projectId: projectId,
                    number: element.number,
                    length : element.length,
                    wide: element.wide,
                    height: element.height,
                    cost: element.cost
                }
        objs.push(_)
    })
    return objs
}

function createQuotation(quotationObj,that) {
base('quotation').create({
    "Dự án": [
        quotationObj.projectId
    ],
    "Hạng Mục": [
        quotationObj.subjectId
    ],
    "Chiều cao": quotationObj.height,
    "Chiều rộng": quotationObj.wide,
    "Chiều dài": quotationObj.length,
    "số lượng": quotationObj.number,
    "Chi phí": parseInt(quotationObj.cost)
  }, function(err, record) {
      if (err) {
        console.log(err);
        that.$notify.error({
            title: 'Error',
            message: `Tạo Dự Án Không Thành Công, Vui lòng kiểm tra lại thông tin`
          });  
        return; }
      //console.log(record.getId());
  });
}

function get_hang_muc(){
    base('Hạng mục').select({
        // Selecting the first 3 records in Grid view:
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
    
        records.forEach(function(record) {
            hang_muc.push(record)
        });
    
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    
    }, function done(err) {
        if (err) { console.error(err); return; }
        document.getElementById('loading').style.display='none'
        mainAction()
    });
}


function postData(url = ``, data = {}) {
  // Default options are marked with *
    return fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, cors, *same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, same-origin, *omit
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: "follow", // manual, *follow, error
        referrer: "no-referrer", // no-referrer, *client
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    })
    .then(response => response); // parses response to JSON
}

function mainAction(){
    Vue.config.devtools = true;
    //quotation table component
    Vue.component('quotation-form', {
        props: ['data'],
        data: function () {
            return {
                loading: '',
                stt: true,
                totalCost: 0,
                innerVisible : false,
                project: {
                    name: '',
                    address: '',
                    phone: ''
                },
                rules:
                  {
                      name:[
                        { required: true, message: 'Vui lòng điền tên dự án', trigger: 'blur' }
                      ],
                      address: [
                        { required: true, message: 'Vui lòng điền địa chỉ', trigger: 'blur' },
                      ],
                      phone: [
                        { required: true, message: 'Vui lòng điền số điện thoại', trigger: 'blur' },
                      ]
                  }  
                
            }
        },
        template: "#quotation-form",
        methods: {
            computeTotalCost: function() {
                let _totalCost = 0;
                this.data.forEach(record => {
                    _totalCost += record.cost;
                })
                this.totalCost = _totalCost;
            },
            submit(formName) {
                this.$refs[formName].validate((valid) => {
                  if (valid) {
                        this.loading = this.$loading({
                        lock: true,
                        text: 'Loading',
                        spinner: 'el-icon-loading',
                        background: 'rgba(0, 0, 0, 0.7)'
                      });
                    createProject(this)
                  } else {
                    //console.log('error submit!!');
                    return false;
                  }
                });
              },

              resetForm(formName) {
                this.$refs[formName].resetFields();
              },

              formatPrice(value) {
                // let val = (value/1).toFixed(2).replace('.',',')
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }

        },
        mounted() {
            this.computeTotalCost();
        }
    })


    // main-form component
    Vue.component('main-form', {
        data: function() {
            return {
                dataAvaible: hang_muc,
                dataInForm:[{
                    cong_tac : '',
                    hang_muc : '',
                    unitPiece : false, // it is represented for "cái", "bộ", "g"
                    unitMd : false, //It is represented for md
                    unitM2: false,
                    unitM3: false,
                    price : 0,
                    number : 0,
                    cost: 0,
                    subjectId:'',
                    length: 0,
                    wide: 0,
                    height: 0,
                    
                }],
                allWorks: '',
                allSubjects : '',
                allPrice: '',
                allUnit: '',
                bug: false
            }
        },
    
        template: '#main-form',

        
        methods: {
            set_cost: function(i) {
                //find unit
                let _unit= ''
                let _dataInForm =  this.dataInForm[i];
                for (let property in _dataInForm) {
                  if (_dataInForm[property] === true && property.indexOf('unit') > -1 ) {
                    _unit = property
                  }
                }

                if (_unit === '') {console.error('unit of data in this form is wrong'); return;}

                
                switch (_unit) {
                  case 'unitPiece':
                    this.dataInForm[i].cost= this.dataInForm[i].price * this.dataInForm[i].number;
                    break;

                  case 'unitMd':
                    this.dataInForm[i].cost = this.dataInForm[i].price * this.dataInForm[i].length * this.dataInForm[i].number;
                    break;

                  case 'unitM2':
                    this.dataInForm[i].cost = this.dataInForm[i].price * this.dataInForm[i].length * this.dataInForm[i].wide  * this.dataInForm[i].number;
                    break;

                  case 'unitM3':
                    this.dataInForm[i].cost = this.dataInForm[i].price * this.dataInForm[i].length * this.dataInForm[i].wide * this.dataInForm[i].height  * this.dataInForm[i].number;
                    break;

                  default:
                    this.bug = true; // when add a new unit, method for computing quotaion will change, so avoid working fail, set bug = true
                    break;
                } 
            },
            add: function(){
                this.dataInForm.push({
                  cong_tac : '',
                  hang_muc : '',
                  unitPiece : false, // it is represented for "cái", "bộ", "g"
                  unitMd : false, //It is represented for md
                  unitM2: false,
                  unitM3: false,
                  price : 0,
                  number : 0,
                  cost: 0,
                  subjectId:'',
                  length: 0,
                  wide: 0,
                  height: 0,
                })
            },
            remove: function(i) {
                //console.log(i)
                this.dataInForm.splice(i-1, 1)
            },
            getSubjectId : function(hang_muc) {
                let _subjectId = '';
                let _dataAvaible  = this.dataAvaible;
                for ( let i in _dataAvaible) {
                    if(_dataAvaible[i].get('Hạng mục') === hang_muc) {
                        _subjectId = _dataAvaible[i].getId();
                        break;
                    }
                }
                return _subjectId
            },
            formatData: function() {
                // get all works
                // get all subject
                // get all price
                // get all unit
                let _todo = Object.assign([]);
                let _subjects = Object.assign({});
                let _prices = Object.assign({});
                let _units = Object.assign({});
                let _dataAvaible = this.dataAvaible;
                _dataAvaible.forEach(data => {
                     
                    let _works = data.get('Công tác');
                    //add into price
                    _prices[data.get('Hạng mục')] = data.get('Giá bán')
                    //add into unit
                    _units[data.get('Hạng mục')] = data.get('Đơn vị tính')
                    if (_todo.indexOf(_works) < 0) {
                        _todo.push(_works);
                        _subjects[_works] = [data.get('Hạng mục')];
                    } else {
                        _subjects[_works].push(data.get('Hạng mục'));
                    }

                })
                this.allWorks =  _todo;
                this.allSubjects = _subjects;
                this.allPrice = _prices;
                this.allUnit = _units;
            },

            filterSubject:function (i) {
                _work = this.dataInForm[i].cong_tac;
                this.dataInForm[i].subjects = this.allSubjects[_work]
            },
            setUnit: function (unitForTrue,index) {
              let _lst= ['unitPiece', 'unitMd', 'unitM2', 'unitM3'];
              _lst.forEach(el => {
                if (unitForTrue === el) {
                  this.dataInForm[index][el]= true
                } else {
                  this.dataInForm[index][el]= false
                }
              })
            },
            setPrice_SubjectId_Unit: function(i) {
                let _hang_muc = this.dataInForm[i].hang_muc;
                this.dataInForm[i].price= this.allPrice[_hang_muc]
                // set subjectId of dataInForm
                let _subjectId = this.getSubjectId(_hang_muc);
                this.dataInForm[i].subjectId= _subjectId;
                //set unit of dataInForm
                let _unit = this.allUnit[_hang_muc];
                switch (_unit) {
                  case 'cái':
                    // this.dataInForm[i].unitPiece = true;
                    this.setUnit('unitPiece',i)
                    break;
                  
                  case 'bộ':
                  // this.dataInForm[i].unitPiece = true;
                  this.setUnit('unitPiece',i)
                  break;


                  case "gói":
                  // this.dataInForm[i].unitPiece = true;
                  this.setUnit('unitPiece',i)
                  break;  

                  case 'md':
                    // this.dataInForm[i].unitMd = true;
                    this.setUnit('unitMd',i)
                    break;

                  case 'm2':
                    // this.dataInForm[i].unitM2 = true;
                    this.setUnit('unitM2',i)
                    break;
                    
                  case 'm3':
                    // this.dataInForm[i].unitM3 =  true;
                    this.setUnit('unitM3',i)
                    break;

                  default:
                    this.bug = true; // when add a new unit, method for computing quotaion will change, so avoid working fail, set bug = true
                    break;
                } 
                // change cost if cost have setted before
                if (this.dataInForm[i].cost !== 0 && typeof this.dataInForm[i].cost !== 'undefined') {
                  console.log('run set cost in setprice ..v.v.', this.dataInForm[i].cost);
                  this.set_cost(i)
                }
            },
            resetForm: function(nameForm) {
                this.$refs[nameForm].resetFields()
            },
            emitViewEvent: function() {
                this.$emit('view-quotation',this.dataInForm)
            },
            formatPrice(value) {
                // let val = (value/1).toFixed(2).replace('.',',')
                return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
        },
        mounted() {
            this.formatData()
        }
        
    });
    
    var app = new Vue({
        el: '#app',
        data: function() {
          return {
            currentTabComponent: 'mainForm',
            dialogTableVisible: false,
            data: ''
           }
        },
        methods: {
            viewQuotation: function(dataGrid) {
                this.data = dataGrid;
                this.dialogTableVisible = true;
            }
        }
      })
}
Vue.config.devtools = true;
