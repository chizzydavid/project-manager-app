<?php 
  require_once('Project.php');

  if (isset($_GET['todo']) && isset($_GET['project'])){
    if ($_GET['todo'] == 'all' && $_GET['project'] == 'all') {
      $all_items = $project->get_all_items();
      echo $all_items;
    }    
  }

  else if (isset($_GET['addproject'])) {
    $newproject = $project->insert_project($_GET['addproject']);
    echo $newproject;
  }

  else if (isset($_GET['delproject'])) {
    $req = $project->delete_project($_GET['delproject']);
    if ($req) echo $req;
    else echo 'There was an error deleting this project';
  }

  else if (isset($_GET['getproject'])) { 
    $project = $project->get_project($_GET['getproject']);
    echo $project;    
  }

  else if (isset($_GET['editproject'])) {
    $newproject = $project->edit_project($_GET['editproject']);
    echo $newproject;
  }



  else if (isset($_GET['addactivity'])) {
    $newactivity = $project->insert_activity($_GET['addactivity']);
    echo $newactivity;
  }

  else if (isset($_GET['delactivity'])) {
    $req = $project->delete_activity($_GET['delactivity'], $_GET['projectId']);
    if ($req) echo $req;
    else echo 'There was an error deleting this item';
  }

  else if (isset($_GET['checkactivity'])) {
    $result = $project->check_activity($_GET['checkactivity'], $_GET['projectId']);
    if ($result) echo $result;
    else echo 'There was a problem checking your activity';
  }

  else if (isset($_GET['update'])) {
    $result = $project->update_progress($_GET['update'], $_GET['progress']);
    if ($result) echo 'Progress update successful';
    else echo 'There was a problem checking your activity';
  }



  else if (isset($_GET['addtodo'])) {
    $newtodo = $project->insert_todo($_GET['addtodo']);
    echo $newtodo;
  }

  else if (isset($_GET['deltodo'])) {
    $req = $project->delete_todo($_GET['deltodo']);
    if ($req)  echo 'Todo item deleted successfully';
    else echo 'There was an error deleting this item';
  }

  else if (isset($_GET['edittodo'])) {
    $newtodo = $project->edit_todo($_GET['edittodo']);
    echo $newtodo;
  }

  else if (isset($_GET['checktodo'])) {
    $result = $project->check_todo($_GET['checktodo']);
    if ($result) echo 'Todo check successful';
    else echo 'There was a problem checking your todo';
  }



?>