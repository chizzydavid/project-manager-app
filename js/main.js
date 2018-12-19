const 
  uncompletedProjects = $('#uncompleted-projects'),
  completedProjects = $('#completed-projects'),
  viewProject = $('#view-project'),
  projectMsg = $('#project-info'),
  pTitle = viewProject.find('#pd-title'), 
  pDescription = viewProject.find('#pd-description'), 
  pDeadline = viewProject.find('#pd-deadline'), 
  pProgress = viewProject.find('#pd-progress'),
  projectActivities = viewProject.find('#project-activities'),
  projectCompleteHeader = $('#project-display h3'),
  projectError = $('#error-project'),
  delProjectBtn = $('#delete-project-icon'),

  activityError = $('#error-activity'),
  activityMsg = $('#activity-info'),
  uncompletedActivities = $('#uncompleted-activities'),
  completedActivities = $('#completed-activities'), 
  actCompleteHeader = $('#project-activities h3'),

  todoDisplay = $('#todo-display'),
  todoMsg = $('#todo-info'),
  uncompletedTodo = $('#uncompleted-todo'),
  completedTodo = $('#completed-todo'),  
  todoCompleteHeader = $('#todo-display h3'),
  todoError = $('#error-todo'),

  home = $('#home'),
  projectViewer = $('#project-viewer');
  url = 'server/process-request.php';

function getAllData() {
  let query = '?todo=all&project=all';
  fetch(url + query).then((response) => {
    if (response.ok) {
      response.json().then((data) => {
        [todos, projects] = [data[0], data[1]];
        if (todos.length > 0) todos.forEach((i) => displayTodo(i));
        else todoMsg.text('No todo items available');

        if (projects.length > 0) projects.forEach((i) => displayProject(i));
        else projectMsg.text('No project items available'); 
      }); 
    }   
    else console.log('Error fetching data ' + response.statusText);
  });
}

function addItem(itemObj, item = 'project') {
  itemObj = JSON.stringify(itemObj);
  let query = item === 'project' ? '?addproject=' : 
              item === 'activity' ? '?addactivity=' : '?addtodo=';

  fetch(url + query + itemObj).then((response) => {
    response.json().then((data) => {
      if (item === 'project') {
        projectMsg.text('');
        resetForm('projectForm', 'New project added successfully');
        projects = data;
        refreshTodo();
        displayProject(data[0]);
      }   
      else if (item === 'activity') {
        activityMsg.text('');
        resetForm('activityForm', 'New activity added.');
        calculateProgress(data);
        displayActivity(data[0]);
        sortPriority(uncompletedActivities);
      }
      else { 
        todoMsg.text('');
        resetForm('todoForm', 'Todo added successfully');        
        displayTodo(data);
        sortPriority(uncompletedTodo); 
      }   
    })
  });
}

function updateItem(itemObj, item = 'project') {
  itemString = JSON.stringify(itemObj);
  let query = item === 'project' ? '?editproject=' : '?edittodo=';
  fetch(url + query + itemString).then((response) => {
    response.json().then((object) => {
      if (item === 'project') {
        let newProject = displayProject(object, 'edit');
        let oldProject = uncompletedProjects.find(`#${itemObj.id}`);
        oldProject.replaceWith(newProject);
        resetForm('projectForm', 'Project update successful');
      }
      else {
        let newTodo = displayTodo(object, 'edit');
        let oldTodo = uncompletedTodo.find(`#${itemObj.id}`);
        oldTodo.replaceWith(newTodo);
        resetForm('todoForm', 'Todo update successful');       
      }
    });
  });
}

function deleteItem(id, item = 'project', projectId) {
  let query = item === 'project' ? `?delproject=${id}` :
              item === 'activity' ? `?delactivity=${id}&projectId=${projectId}` :
               `?deltodo=${id}`;
  fetch(url + query).then((response) => {
    response.json().then((data) => {
      if (item === 'activity') calculateProgress(data);
      else if (item === 'project') {
        projects = data;
        refreshTodo();
      }
      else console.log(text.trim());
    });
  }); 
}

function checkItem(id, item = 'activity', projectId) {
  let query = 
    item === 'activity' ? `?checkactivity=${id}&projectId=${projectId}` : `?checktodo=${id}`;
  fetch(url + query).then((response) => {
    response.json().then((data) => { 
      if (item === 'activity') {
        calculateProgress(data);
        sortPriority(completedActivities);
      } 
      else sortPriority(completedTodo);
    });
  });
}

function displayProject(project, edit) {
  let newProject = $(
    `
    <div id="${project.project_id}" class="project">
      <p class="title header">${project.title}</p>
      <div class="project-details">
        <p class="hide description">${project.description}</p>      
        <div class="deadline-sec">Deadline </br> <span class="deadline">${project.deadline}</span> </div>
        <div class="progress-sec">Progress: <span class="progress">${project.progress}</span><span>%</span></br> 
          <div class="bar-wrapper"> <div class="progress-bar" style="width:${project.progress}%"> </div> </div>
             
        </div>
      </div>

      <div class="project-buttons">
        <span> <i id="${project.project_id}" class="edit-project fa fa-edit"></i></span>
        <span> <i id="${project.project_id}" class="delete-project fa fa-trash"></i></span>
      </div>      
    </div>
    `          
  );
  if (typeof edit !== "undefined") return newProject;
  if (project.progress < 100) uncompletedProjects.prepend(newProject)
  else {
    if (projectCompleteHeader.hasClass('hide')) projectCompleteHeader.removeClass('hide');
    completedProjects.prepend(newProject);
  }
}

function getProject(id) {
  let query = '?getproject=' + id;
  fetch(url + query).then((response) => {
    response.json().then((data) => detailProject(data));
  });
}

function detailProject(project) {
  home.hide();
  projectViewer.show();
  projectViewer.attr('data-project-id', `${project.project_id}`)
  viewProject.show();  
  pTitle.text(`${project.title}`);
  pDescription.text(`${project.description}`);
  pDeadline.text(`${project.deadline}`);
  pProgress.text(`${project.progress}`);
  $('#progress-bar').css('width', `${project.progress}%`);
  delProjectBtn.parent().attr('id', project.project_id);

  let activities = project.activities;
  completedActivities.empty();
  uncompletedActivities.empty();
  activities.map((activity) =>  displayActivity(activity));
}

function calculateProgress(activities) {
  let progress = 0, medFreq = highFreq = 0, n = activities.length, 
  lowPt, mediumPt, highPt, completed = [], pointsArr = [],

  projectId = activities[0].project_id;
  activities.forEach((i) => {  
    i.priority == '2' ? medFreq += 1 : i.priority == '3' ? highFreq += 1 : '';
    i.status == 'completed' ? completed.push(i.activity_id) : '';
  });
  [lowPt, mediumPt, highPt]= [60 / n, 25 / (medFreq + highFreq), 15 / highFreq];

  if (highFreq == 0)
    [lowPt, mediumPt, highPt] = [80 / n, 20 / (medFreq + highFreq), 0];

  if (medFreq == 0)
    [lowPt, mediumPt, highPt] = [70 / n, 0, 30 / highFreq];

  if (medFreq == 0 && highFreq == 0)
    [lowPt, mediumPt, highPt] = [100 / n, 0, 0]; 


  activities.forEach((el) => {
    let addedPoint = (el.priority == 2) ? mediumPt : (el.priority == 3) ? mediumPt + highPt : 0;
    let totalPoints = lowPt + addedPoint;
    pointsArr.push([el.activity_id, totalPoints]);
  });
  pointsArr.forEach((i) => projectActivities.find(`#${i[0]}`).attr('data-points', `${i[1]}`));

  if (completed.length !== 0) {
    pointsArr.forEach((i) => {
      if (completed.includes(i[0])) progress += i[1];
    }); 
    progress = Number(progress).toFixed(0);
  }
  else progress = 0;

  pProgress.text(progress);
  let id = projectViewer.attr('data-project-id');
  projectDisplay.find(`#${id}`).find('.progress').text(progress);
  projectDisplay.find(`#${id}`).find('.progress-bar').css('width', `${progress}%`);
  $('#progress-bar').css('width', `${progress}%`);
  updateProgress(projectId, progress);   
}

function updateProgress(projectId, progress) {
  let query = `?update=${projectId}&progress=${progress}`
  fetch(url + query).then((response) => {
    response.text().then((text) => console.log(text.trim()));
  });
}

function displayActivity(activity) {
  let [priority, ptColor] = activity.priority == '3' ? ['High', '#27ae61'] : 
                            activity.priority == '2' ? ['Medium', '#2c97df'] : ['Low', '#f1b80e'];
  let newActivity = $(
    `
    <div id="${activity.activity_id}" class="project-entry"  data-priority="${activity.priority}" >
      <p class="entry-title">${activity.title}</p>
      <p class="entry-details">Priority: <span class="priority" style="color:${ptColor}"> ${priority} </span></p>
      <div class="entry-buttons">
        <span> <i id="${activity.activity_id}" class="delete-activity fa fa-trash"></i></span>
        <span> <i id="${activity.activity_id}" class="check-activity fa fa-check"></i></span>
      </div>
    </div>
    `          
  );
  if (activity.status == "uncompleted") 
    uncompletedActivities.append(newActivity)
  else {
    if (actCompleteHeader.hasClass('hide')) actCompleteHeader.removeClass('hide'); 
    completedActivities.append(newActivity);
  }
}

function displayTodo(todo, edit) {
  let newTodo, priority, ptColor, projectOptions;
  [priority, ptColor] = todo.priority == '3' ? ['High', '#27ae61'] : 
                        todo.priority == '2' ? ['Medium', '#2c97df'] : ['Low', '#f1b80e'];

  if (projects.length !== 0) {
    projectOptions = projects.map((project) => {
      let l = project.title.length, t = project.title;
      //if length of project title is greater than 50, slice and attach ellipsis
      return `<option value="${project.project_id}"> ${t.substr(0, 50)}${l > 50 ? '...' : ''} </option>`;
    }).join(' ');    
  } 
  else projectOptions = '';

  newTodo = $(
    `
    <div id="${todo.todo_id}" class="todo" data-priority="${todo.priority}">
      <p class="title">${todo.title}<i id="show-more" class="fa fa-caret-down"></i></p>

      <div class="todo-details">
        <p>Priority: <span class="priority" style="color:${ptColor}"> ${priority} </span></p>
        <p id="todo-project">  
          <select id="todo-project-form">
            <option value="">Add Todo to Project</option>
            ${projectOptions}
          </select>
          <label class="add-todo-project" for="priority">Add</label>
        </p>
        <p class="added-to-project hide"> </p>
      </div>

      <div class="todo-buttons">
        <span> <i id="${todo.todo_id}" class="edit-todo fa fa-edit"></i></span>
        <span> <i id="${todo.todo_id}" class="delete-todo fa fa-trash"></i></span>
        <span> <i id="${todo.todo_id}" class="check-todo fa fa-check"></i></span>
      </div>
    </div>
    `          
  );
  if (typeof edit !== "undefined") return newTodo;
  if (todo.status == "uncompleted") uncompletedTodo.append(newTodo)
  else {
    if (todoCompleteHeader.hasClass('hide')) todoCompleteHeader.removeClass('hide'); 
    completedTodo.append(newTodo);
  }
}

function refreshTodo() {
  uncompletedTodo.empty();
  completedTodo.empty();
  if (todos.length !== 0) todos.forEach((i) => displayTodo(i));
  else todoMsg.text('No todo items available');
}


function resetForm(form = 'projectForm', msg = '') {
  if (form === 'projectForm') {
    projectTitle.val('');
    projectDescription.val('');
    projectDeadline.val('');
    projectError.text(msg);
    projectFormHeader.text('Add New Project');
    addProjectBtn.removeClass('hide');
    saveEditProject.addClass('hide');       
  }
  else if (form === 'activityForm') {
    activityTitle.val('');
    activityPriority.val('');
    activityError.text(msg);
  }
  else  {
    todoTitle.val('');
    todoPriority.val('');
    todoError.text(msg);
    todoFormHeader.text('Add Todo');
    addTodoButton.removeClass('hide');
    saveEditTodo.addClass('hide');      
  }
}

function sortPriority(domObject) {
  let index, sorted = [], domChildren = [], children = domObject.children();
  //get individual elements as non-jquery objects
  children.each(function() { domChildren.push(this); }); 
  let elArr = [...domChildren];

  domChildren.forEach((el) => {
    let highestPriorityNumber = el.getAttribute('data-priority');
    let highestPriorityElement = elArr[0];

    elArr.forEach((el, idx) => {
      let priorityNumber = el.getAttribute('data-priority');
      if (priorityNumber >= highestPriorityNumber) {
        highestPriorityElement = el;
        highestPriorityNumber = priorityNumber;
        index = idx;
      }
    });
    sorted.push(highestPriorityElement);
    elArr.splice(index, 1);
  });
  domObject.empty();
  sorted.forEach((el) => domObject.append(el));
}

function eventListeners() {
  //todo timing should expire every 24hours not start afresh everyday
  let editId, 
    projectObj = {title: null, description: null, deadline: null, progress: 0, status: 'uncompleted'},
    activityObj = {title: null, priority: 2, status: 'uncompleted'},
    todoObj = {title: null, priority: 2, status: 'uncompleted'};
    showProjectBtn = $('#show-projects-btn'),
    showTodoBtn = $('#show-todo-btn'),
    projectFormWrapper = $('#project-form-wrapper'),
    projectFormIcon = $('#project-form-icon'),    
    projectFormHeader = $('#project-form-header'),
    projectContainer = $('#project-container'),
    projectDisplay = $('#project-display'),
    addProjectBtn = $('#add-project'),    
    saveEditProject = $('#save-project-edit'), 
    projectTitle = $('#project-title'),
    projectDescription = $('#project-description'),
    projectDeadline = $('#project-deadline'), 
    projectDetailsInfo = $('#project-details-info'),

    activityFormWrapper = $('#activity-form-wrapper'),
    activityFormIcon = $('#activity-form-icon'), 
    addActivityBtn = $('#add-activity'),
    activityTitle = $('#activity-title'),
    activityPriority = $('#activity-priority'), 

    search = $('#search'),
    todoContainer = $('#todo-container'),
    addTodoButton = $('#add-todo'), 
    saveEditTodo = $('#save-todo-edit'), 
    removeButton = $('#remove-todo'),
    todoTitle = $('#todo-title'),
    todoPriority = $('#todo-priority'),    
    todoFormWrapper = $('#todo-form-wrapper'),
    todoFormIcon = $('#todo-form-icon'),
    todoFormHeader = $('#todo-form-header'),
    check = $('.check-todo');
  todoContainer.hide();
  projectViewer.hide();

  function getFormData(form = 'projectForm') {
    let newItem, title, deadline, description, priority;
    //grab form values depending on the form passed as an argument
    formFields = 
      form === 'projectForm' ? [projectTitle.val(), projectDescription.val(), projectDeadline.val()] :
      form === 'activityForm' ? [activityTitle.val(), activityPriority.val()] :
                                [todoTitle.val(), todoPriority.val()];     

    form === 'projectForm' ? [title, description, deadline] = formFields :
    form === 'activityForm' ? [title, priority] = formFields : 
                             [title, priority] = formFields;

    //form validation here
    if (form === 'projectForm') {
      if (title === '' || deadline === '') {
        projectError.text('Please complete the form and try again.');
        return;
      }      
      projectError.text('');
      return newItem = Object.assign({}, projectObj, { title, description, deadline });    
    }

    else if (form === 'activityForm') {
      if (title === '' || priority === '') {
        activityError.text('Please complete the form and try again.');
        return;
      } 
      activityError.text('');
      return newItem = Object.assign({}, activityObj, { title, priority });    
    }

    else {
      if (title === '' || priority === '') {
        todoError.text('Please complete the form and try again.');
        return;
      }
      todoError.text('');
      return newItem = Object.assign({}, todoObj, { title, priority });    
    }
  }

  function showEditForm(object, form = 'projectForm') {
    //object argument is a dom object
    if (form === 'projectForm') {
      projectTitle.val(object.find('.title').text());
      projectDescription.val(object.find('.description').text().trim());
      projectDeadline.val(object.find('.deadline').text().trim());

      projectFormHeader.text('Edit Project');
      addProjectBtn.addClass('hide');
      saveEditProject.removeClass('hide');       
      projectFormWrapper.toggleClass('show');
      projectFormIcon.attr('class', 'fa fa-close');
    }
    else {
      object.find('#show-more').click();
      todoTitle.val(object.find('.title').text());

      todoFormHeader.text('Edit Todo');
      addTodoButton.addClass('hide');
      saveEditTodo.removeClass('hide');       
      todoFormWrapper.toggleClass('show');
      todoFormIcon.attr('class', 'fa fa-close');
    }  
  }

  showProjectBtn.on('click', (e) => {
    if (projectContainer.hasClass('curr-display')) return;
    $('.nav-item').removeClass('active');
    $(e.target).addClass('active');
    todoContainer.fadeOut(0).removeClass('curr-display');
    projectContainer.fadeIn(700).addClass('curr-display');
  });

  projectFormIcon.on('click', function(e) {
    resetForm('projectForm');
    projectFormWrapper.toggleClass('show');
    if ($(this).hasClass('fa-plus')) $(this).attr('class', 'fa fa-close');
    else $(this).attr('class', 'fa fa-plus');
  });

  addProjectBtn.on('click', (e) => {
    e.preventDefault();
    let newProject = getFormData();
    typeof newProject == "object" ? addItem(newProject) : '';
  });

  saveEditProject.on('click', (e) => {
    e.preventDefault();
    let editedProject = getFormData();
    editedProject['id'] = editId;
    typeof editedProject == "object" ? updateItem(editedProject) : '';
  });

  projectDisplay.on('click', function(e) {
    let _this = $(e.target);
    if (_this.hasClass('title')) { 
      let id = Number(_this.parent().attr('id'));
      getProject(id);
    }
    else if (_this.hasClass('delete-project')) {
      let id = _this.attr('id');
      if (completedProjects.children().length == 1 && !projectCompleteHeader.hasClass('hide')) 
        projectCompleteHeader.addClass('hide');
      if (uncompletedProjects.children().length == 0) projectMsg.text('No project Items available');      
      deleteItem(id);
      _this.parent().parent().parent().fadeOut(300, function() { $(this).remove(); });
      
    }
    else return;
  });

  uncompletedProjects.on('click', function(e) {
    let _this = $(e.target);
    if (_this.hasClass('edit-project')) {
      editId = Number(_this.attr('id'));
      let project = _this.parent().parent().parent();
      showEditForm(project);      
    }    
  });


  $('#show-home').on('click', () => {
    if (!actCompleteHeader.hasClass('hide')) actCompleteHeader.addClass('hide');
    home.fadeToggle(200);
    projectDetailsInfo.text('');
    projectViewer.fadeToggle(200); 
  });

  projectActivities.on('click', function(e) {
    let _this = $(e.target);
    if (_this.hasClass('delete-activity')) {
      let id = _this.attr('id');
      let mainParent = _this.parent().parent().parent().parent();
      let projectId = projectViewer.attr('data-project-id');
      if (mainParent.is(completedActivities) && completedActivities.children().length == 1) 
        actCompleteHeader.addClass('hide');
      if (mainParent.is(uncompletedActivities) && uncompletedActivities.children().length == 1)
        activityMsg.text('No activities available');       
      deleteItem(id, 'activity', projectId);
      _this.parent().parent().parent().remove(); 
    }
    else return;
  });

  uncompletedActivities.on('click', function(e) {
    let _this = $(e.target);
    if (_this.hasClass('check-activity')) {
      let id = _this.attr('id');
      let projectId = projectViewer.attr('data-project-id');
      let activity = _this.parent().parent().parent();
      let activityObj = activity.detach();

      if (actCompleteHeader.hasClass('hide')) actCompleteHeader.removeClass('hide'); 
      checkItem(id, 'activity', projectId);
      completedActivities.append(activityObj);
    }
    else return;
  });

  activityFormIcon.on('click', function (e) {
    resetForm('activityForm');
    activityFormWrapper.toggleClass('show');
    if ($(this).hasClass('fa-plus')) $(this).attr('class', 'fa fa-close');
    else $(this).attr('class', 'fa fa-plus');
  });

  addActivityBtn.on('click', (e) => {
    e.preventDefault();
    let newActivity = getFormData('activityForm');
    newActivity['id'] = delProjectBtn.parent().attr('id');
    typeof newActivity == "object" ? addItem(newActivity, 'activity') : '';
  });

  delProjectBtn.on('click', function(e) {
    let id = $(this).parent().attr('id');
    deleteItem(id);
    projectDisplay.find(`#${id}`).remove();
    viewProject.hide(400);
    projectDetailsInfo.text('This project has been deleted');
  });



  showTodoBtn.on('click', (e) => {
    if (todoContainer.hasClass('curr-display')) return;
    $('.nav-item').removeClass('active');
    $(e.target).addClass('active');    
    projectContainer.fadeOut(0).removeClass('curr-display');
    todoContainer.fadeIn(700).addClass('curr-display');
  });

  todoFormIcon.on('click', function (e) {
    resetForm('todoForm');
    todoFormWrapper.toggleClass('show');
    if ($(this).hasClass('fa-plus')) $(this).attr('class', 'fa fa-close');
    else $(this).attr('class', 'fa fa-plus');
  });

  addTodoButton.on('click', (e) => {
    e.preventDefault();
    let newTodo = getFormData('todoForm');
    typeof newTodo == "object" ? addItem(newTodo, 'todo') : '';
  });

  saveEditTodo.on('click', (e) => {
    e.preventDefault();
    let editedTodo = getFormData('todoForm');
    editedTodo['id'] = editId;
    typeof editedTodo == "object" ? updateItem(editedTodo, 'todo') : '';
  });

  todoDisplay.on('click', function(e) {
    let _this = $(e.target);
    if (_this.hasClass('delete-todo')) {
      _this.parent().parent().parent().fadeOut(300, function() { $(this).remove(); });
      if (completedTodo.children().length == 1 && !todoCompleteHeader.hasClass('hide')) 
        todoCompleteHeader.addClass('hide');
      if (uncompletedTodo.children().length == 1) todoMsg.text('No todo Items available');      
      deleteItem(e.target.id, 'todo');
    }
    else if (_this.attr('id') === 'show-more') {
      _this.parent().parent().toggleClass('show');
      if (_this.hasClass('fa-caret-down'))  _this.attr('class', 'fa fa-caret-up');
      else _this.attr('class', 'fa fa-caret-down');
    }
    else if (_this.hasClass('add-todo-project')) {
      let id = _this.prev().val();
      if (id != '') {
        let todo = _this.parent().parent().parent();
        let [title, priority] = [todo.find('.title').text(), todo.find('.priority').text()];
        let newActivity = Object.assign({}, activityObj, {title, priority});
        newActivity['id'] = id;
        projects.forEach((el) => {
          if (el.project_id == id) {
            _this.parent().hide();
            _this.parent().next().text(el.title).removeClass('hide');
          }
        });
        addItem(newActivity, 'activity');
      }
    }
    else return;
  });

  uncompletedTodo.on('click', function(e) {
    let _this = $(e.target);
    if (_this.hasClass('check-todo')) {
      let id = _this.attr('id');
      let todo = _this.parent().parent().parent();
      todo.find('#show-more').click();
      let todoObj = todo.detach();
      if (todoCompleteHeader.hasClass('hide')) todoCompleteHeader.removeClass('hide'); 
      checkItem(id, 'todo');
      completedTodo.append(todoObj);
    }
    else if (_this.hasClass('edit-todo')) {
      editId = Number(_this.attr('id'));
      let todo = _this.parent().parent().parent();
      showEditForm(todo, 'todoForm');
    }        
    else return;
  });

}

getAllData();
eventListeners();





