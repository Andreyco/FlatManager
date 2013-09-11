<?php

class PrettyManager
{
	/**
	 * Path to browse
	 *
	 * @var string
	 */
	private $givenPath;

	private $absPath;

	/**
	 * Public base URL. This URL should be
	 * accessible over HTTP protocol
	 *
	 * @var string
	 */
	private $publicBaseUrl = 'http://localhost:8888/simplemanager/';

	/**
	 * Read given path
	 */
	public function readPath($path)
	{
		$this->givenPath = $path;
		$this->absPath = str_replace('//', '/', getcwd().'/'.$this->givenPath);

		if (is_file($this->absPath)) {
			// Load file info
			$data = array(
				'isFile' => true,
				'path' => $this->givenPath,
				'info' => $this->getFileInfo(),
			);
		} else {
			// Read directory content
			$data = array(
				'isFile' => false,
				'content' => $this->getDirContent(),
			);
		}

		$this->returnContent($data);
	}

	private function returnContent($content)
	{
		echo json_encode($content);
	}

	private function getFileInfo()
	{
		$stat = stat($this->absPath);

		$pathInfo = pathinfo($this->absPath);

		$return = array(
			'atime' => $stat['atime'],
			'mtime' => $stat['mtime'],
			'ctime' => $stat['ctime'],
			'size' => $stat['size'],
			'mime' => mime_content_type($this->absPath),
			'publicUrl' => $this->getPublicUrl($this->givenPath),
		);

		return array_merge($return, $pathInfo);
	}

	private function getDirContent()
	{
		$content = array();

		if ($handle = opendir($this->absPath)) {
		    while (false !== ($item = readdir($handle))) {
		        if ($item != "." && $item != "..") {
		        	array_push($content,  array(
		        		'name' => $item,
		        		'path' => $this->givenPath.'/'.$item,
		        		'publicUrl' => is_file($this->absPath.'/'.$item) ? $this->getPublicUrl($item) : false,
	        		));
		        }
		    }
		    closedir($handle);
		}

		return $content;
	}

	private function getPublicUrl($path)
	{
		return $this->publicBaseUrl.ltrim($path, '/');
	}


}
$pm = new PrettyManager;

// Provide path or fallback to root
$pm->readPath(isset($_GET['path']) ? $_GET['path'] : '/');
